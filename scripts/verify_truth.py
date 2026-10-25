from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import IsolationForest

from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from statsmodels.stats.multicomp import pairwise_tukeyhsd

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

BASELINE = json.loads((ROOT / "data/baseline.json").read_text(encoding="utf-8"))
EXCEL = ROOT / BASELINE["source_files"]["excel"]["path"]
PROCESSED = ROOT / BASELINE["source_files"]["processed_csv"]["path"]
NOTEBOOK = ROOT / "notebooks/ADS_Mini_Project.ipynb"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def assert_close(actual, expected, atol=1e-6, rtol=1e-6, label="value"):
    if not math.isclose(float(actual), float(expected), rel_tol=rtol, abs_tol=atol):
        raise AssertionError(f"{label}: actual={actual!r}, expected={expected!r}")


def main() -> None:
    from backend.app.analytics.forecasting import forecast
    from backend.app.analytics.preprocessing import feature_engineer

    # 1. Fingerprint the frozen sources.
    for key, path in (("excel", EXCEL), ("processed_csv", PROCESSED), ("notebook", NOTEBOOK)):
        expected_hash = BASELINE["source_files"][key]["sha256"] if key != "notebook" else BASELINE["source_files"]["notebook"]["sha256"]
        actual_hash = sha256(path)
        if actual_hash != expected_hash:
            raise AssertionError(f"{key} SHA256 changed: {actual_hash} != {expected_hash}")

    # 2. Raw + processed integrity.
    raw = pd.read_excel(EXCEL, sheet_name="Orders")
    returns = pd.read_excel(EXCEL, sheet_name="Returns")
    people = pd.read_excel(EXCEL, sheet_name="People")
    processed = pd.read_csv(PROCESSED)
    expected = BASELINE["dataset"]

    assert raw.shape == tuple(expected["orders_shape"])
    assert processed.shape == tuple(expected["processed_shape"])
    assert len(returns) == expected["returns_rows"]
    assert len(people) == expected["people_rows"]
    assert raw.isna().sum().sum() == expected["missing_values_orders"]
    assert raw.duplicated().sum() == expected["duplicate_rows_orders"]
    assert processed.isna().sum().sum() == expected["missing_values_processed"]
    assert processed.duplicated().sum() == expected["duplicate_rows_processed"]
    assert raw["Order ID"].nunique() == expected["distinct_orders"]
    assert raw["Customer ID"].nunique() == expected["distinct_customers"]
    assert raw["Product ID"].nunique() == expected["distinct_products"]
    assert_close(raw["Sales"].sum(), expected["total_sales"], atol=1e-8, label="total_sales")
    assert_close(raw["Profit"].sum(), expected["total_profit"], atol=1e-8, label="total_profit")
    assert int(raw["Quantity"].sum()) == expected["total_quantity"]
    assert str(pd.to_datetime(raw["Order Date"]).min().date()) == expected["order_date_min"]
    assert str(pd.to_datetime(raw["Order Date"]).max().date()) == expected["order_date_max"]

    assert set(returns["Order ID"]).issubset(set(raw["Order ID"]))
    assert returns["Order ID"].nunique() == expected["returns_unique_order_ids"]
    assert_close(
        returns["Order ID"].nunique() / raw["Order ID"].nunique(),
        expected["returns_rate_of_distinct_orders"],
        atol=1e-12,
        label="return_rate",
    )
    assert set(people["Region"]) == set(raw["Region"].unique())

    # 3. Rebuild derived fields from source and compare to processed.
    rebuilt = raw.copy()
    order_dt = pd.to_datetime(rebuilt["Order Date"])
    ship_dt = pd.to_datetime(rebuilt["Ship Date"])
    rebuilt["Year"] = order_dt.dt.year
    rebuilt["Month"] = order_dt.dt.month
    rebuilt["Month Name"] = order_dt.dt.month_name()
    rebuilt["Quarter"] = order_dt.dt.quarter
    rebuilt["Day"] = order_dt.dt.day
    rebuilt["Day of Week"] = order_dt.dt.day_name()
    rebuilt["Week"] = order_dt.dt.isocalendar().week.astype("int64")
    rebuilt["Profit Margin"] = np.where(rebuilt["Sales"] != 0, rebuilt["Profit"] / rebuilt["Sales"] * 100, 0)
    rebuilt["Shipping Days"] = (ship_dt - order_dt).dt.days
    rebuilt["Order Month"] = order_dt.dt.to_period("M").astype(str)

    derived_columns = [
        "Year",
        "Month",
        "Month Name",
        "Quarter",
        "Day",
        "Day of Week",
        "Week",
        "Profit Margin",
        "Shipping Days",
        "Order Month",
    ]

    for col in derived_columns:
        if col not in processed.columns:
            raise AssertionError(f"Missing processed column: {col}")
        if pd.api.types.is_numeric_dtype(processed[col]) and pd.api.types.is_numeric_dtype(rebuilt[col]):
            if not np.allclose(processed[col].to_numpy(), rebuilt[col].to_numpy(), rtol=1e-10, atol=1e-10, equal_nan=True):
                raise AssertionError(f"Derived numeric column differs: {col}")
        else:
            if not processed[col].astype(str).equals(rebuilt[col].astype(str)):
                raise AssertionError(f"Derived categorical/date column differs: {col}")

    # Runtime preprocessing must match the frozen processed dataset as well.
    runtime_frame = feature_engineer(raw.copy())
    for col in derived_columns:
        if pd.api.types.is_numeric_dtype(processed[col]) and pd.api.types.is_numeric_dtype(runtime_frame[col]):
            if not np.allclose(
                processed[col].to_numpy(),
                runtime_frame[col].to_numpy(),
                rtol=1e-10,
                atol=1e-10,
                equal_nan=True,
            ):
                raise AssertionError(f"Runtime preprocessing differs from processed data: {col}")
        elif not processed[col].astype(str).equals(runtime_frame[col].astype(str)):
            raise AssertionError(f"Runtime preprocessing differs from processed data: {col}")

    # 4. Notebook-reference analytics. These are recomputed, not copied from outputs.
    ref = BASELINE["notebook_reference_results"]

    sales = raw["Sales"]
    n = len(sales)
    mean_sales = sales.mean()
    std_sales = sales.std()
    tcrit = stats.t.ppf(0.975, n - 1)
    se = std_sales / np.sqrt(n)
    moe = tcrit * se
    ci = (mean_sales - moe, mean_sales + moe)
    ci_ref = ref["confidence_interval_mean_sales_95pct"]
    assert n == ci_ref["sample_size"]
    assert_close(mean_sales, ci_ref["mean_sales"], atol=5e-4, label="ci mean")
    assert_close(se, ci_ref["standard_error"], atol=5e-4, label="ci se")
    assert_close(moe, ci_ref["margin_of_error"], atol=5e-4, label="ci moe")
    assert_close(ci[0], ci_ref["lower_limit"], atol=5e-4, label="ci lower")
    assert_close(ci[1], ci_ref["upper_limit"], atol=5e-4, label="ci upper")

    consumer = raw.loc[raw["Segment"] == "Consumer", "Sales"]
    corporate = raw.loc[raw["Segment"] == "Corporate", "Sales"]
    t_stat, t_p = stats.ttest_ind(consumer, corporate, equal_var=False)
    t_ref = ref["welch_t_test_consumer_vs_corporate_sales"]
    assert_close(t_stat, t_ref["t_statistic"], atol=5e-5, label="welch t")
    assert_close(t_p, t_ref["p_value"], atol=5e-6, label="welch p")

    groups = [raw.loc[raw["Category"] == c, "Profit"] for c in ["Furniture", "Office Supplies", "Technology"]]
    f_stat, f_p = stats.f_oneway(*groups)
    anova_ref = ref["one_way_anova_profit_by_category"]
    assert_close(f_stat, anova_ref["f_statistic"], atol=5e-5, label="anova F")
    assert_close(f_p, anova_ref["p_value"], atol=5e-6, label="anova p")

    contingency = pd.crosstab(raw["Segment"], raw["Category"])
    chi2, chi_p, dof, expected_freq = stats.chi2_contingency(contingency)
    chi_ref = ref["chi_square_segment_x_category"]
    assert_close(chi2, chi_ref["chi_square"], atol=5e-5, label="chi2")
    assert int(dof) == chi_ref["df"]
    assert_close(chi_p, chi_ref["p_value"], atol=5e-6, label="chi p")

    tukey = pairwise_tukeyhsd(raw["Profit"], raw["Category"], alpha=0.05)
    tukey_pairs = []
    for g1, g2, md, padj, lower, upper, reject in tukey._results_table.data[1:]:
        tukey_pairs.append({
            "group1": g1,
            "group2": g2,
            "mean_difference": float(md),
            "p_adj": float(padj),
            "reject": bool(reject),
        })
    for actual, expected_pair in zip(tukey_pairs, ref["tukey_hsd_profit_by_category"]):
        assert actual["group1"] == expected_pair["group1"]
        assert actual["group2"] == expected_pair["group2"]
        assert_close(actual["mean_difference"], expected_pair["mean_difference"], atol=1e-4, label="tukey diff")
        assert_close(actual["p_adj"], expected_pair["p_adj"], atol=1e-4, label="tukey p")
        assert actual["reject"] == expected_pair["reject"]

    # Notebook's exact simple regression split.
    Xs = raw[["Quantity"]]
    ys = raw["Sales"]
    X_train, X_test, y_train, y_test = train_test_split(Xs, ys, test_size=0.20, random_state=42)
    sm = LinearRegression().fit(X_train, y_train)
    pred = sm.predict(X_test)
    simple_ref = ref["simple_linear_regression_quantity_to_sales"]
    assert len(X_train) == simple_ref["training_samples"]
    assert len(X_test) == simple_ref["testing_samples"]
    assert_close(sm.intercept_, simple_ref["intercept"], atol=1e-10, label="simple intercept")
    assert_close(sm.coef_[0], simple_ref["quantity_coefficient"], atol=1e-10, label="simple coefficient")
    assert_close(mean_absolute_error(y_test, pred), simple_ref["mae"], atol=5e-4, label="simple mae")
    assert_close(mean_squared_error(y_test, pred), simple_ref["mse"], atol=5e-1, label="simple mse")
    assert_close(math.sqrt(mean_squared_error(y_test, pred)), simple_ref["rmse"], atol=5e-4, label="simple rmse")
    assert_close(r2_score(y_test, pred), simple_ref["r2"], atol=5e-5, label="simple r2")

    # Notebook's exact multiple regression split and one-hot encoding.
    features = ["Quantity", "Discount", "Category", "Sub-Category", "Region", "Segment"]
    X_multi = raw[features]
    y_multi = raw["Sales"]
    encoded = pd.get_dummies(
        X_multi,
        columns=["Category", "Sub-Category", "Region", "Segment"],
        drop_first=True,
    )
    Xm_train, Xm_test, ym_train, ym_test = train_test_split(encoded, y_multi, test_size=0.20, random_state=42)
    mm = LinearRegression().fit(Xm_train, ym_train)
    mpred = mm.predict(Xm_test)
    multi_ref = ref["multiple_linear_regression_current_notebook"]
    assert encoded.shape[1] == multi_ref["encoded_feature_count"]
    assert len(Xm_train) == multi_ref["training_samples"]
    assert len(Xm_test) == multi_ref["testing_samples"]
    assert_close(mean_absolute_error(ym_test, mpred), multi_ref["mae"], atol=5e-4, label="multi mae")
    assert_close(mean_squared_error(ym_test, mpred), multi_ref["mse"], atol=5e-1, label="multi mse")
    assert_close(math.sqrt(mean_squared_error(ym_test, mpred)), multi_ref["rmse"], atol=5e-4, label="multi rmse")
    assert_close(r2_score(ym_test, mpred), multi_ref["r2"], atol=5e-5, label="multi r2")

    # 5. Anomaly baseline.
    def iqr_mask(s: pd.Series) -> pd.Series:
        q1, q3 = s.quantile([0.25, 0.75])
        iqr = q3 - q1
        return (s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)

    sales_iqr = iqr_mask(raw["Sales"]).sum()
    profit_iqr = iqr_mask(raw["Profit"]).sum()
    sales_z = (np.abs(stats.zscore(raw["Sales"])) > 3).sum()
    profit_z = (np.abs(stats.zscore(raw["Profit"])) > 3).sum()
    a_ref = ref["anomaly_detection_current_notebook"]
    assert int(sales_iqr) == a_ref["iqr_sales_anomalies"]
    assert int(profit_iqr) == a_ref["iqr_profit_anomalies"]
    assert int(sales_z) == a_ref["zscore_sales_anomalies"]
    assert int(profit_z) == a_ref["zscore_profit_anomalies"]

    iso = IsolationForest(n_estimators=200, contamination="auto", random_state=42)
    iso_pred = iso.fit_predict(raw[["Sales", "Quantity", "Discount", "Profit"]])
    iso_anomalies = int((iso_pred == -1).sum())
    iso_normal = int((iso_pred == 1).sum())
    assert iso_anomalies == a_ref["isolation_forest_anomalies"]
    assert iso_normal == a_ref["isolation_forest_normal"]

    # 6. Forecast analytical contract.
    # Exact future values are intentionally not frozen. statsmodels can legitimately
    # change numerical output across releases, while the forecast contract remains stable.
    forecast_actual = forecast(raw)
    history = forecast_actual["history"]
    validation = forecast_actual["validation"]
    future_rows = forecast_actual["forecast"]

    assert len(history) == 48
    assert history[0]["period"] == "2023-01"
    assert history[-1]["period"] == "2026-12"
    assert len(future_rows) == 6

    expected_periods = pd.date_range("2027-01-01", periods=6, freq="MS").strftime("%Y-%m").tolist()
    assert [row["period"] for row in future_rows] == expected_periods
    assert validation["selected"]["mae"] < validation["seasonal_naive"]["mae"]
    assert validation["selected"]["rmse"] < validation["seasonal_naive"]["rmse"]

    forecasts = np.asarray([row["forecast"] for row in future_rows], dtype=float)
    assert np.isfinite(forecasts).all()
    assert (forecasts >= 0).all()
    for row in future_rows:
        assert row["lower95"] <= row["lower80"] <= row["forecast"] <= row["upper80"] <= row["upper95"]
        assert all(np.isfinite(float(row[key])) for key in ["forecast", "lower80", "upper80", "lower95", "upper95"])

    assert forecast_actual["model"] == "Holt-Winters Exponential Smoothing"
    assert forecast_actual["uncertainty_method"] == "State-space simulation with bootstrap errors"
    assert forecast_actual["direction"] in {"upward", "stable/downward"}

    print("PHASE 11 TRUTH GATE: PASS")
    print("- frozen source fingerprints: PASS")
    print("- raw/processed dataset integrity: PASS")
    print("- derived feature reconstruction + runtime preprocessing parity: PASS")
    print("- notebook CI/t-test/ANOVA/Tukey/chi-square: PASS")
    print("- notebook regression baselines: PASS")
    print("- notebook anomaly baselines: PASS")


if __name__ == "__main__":
    main()
