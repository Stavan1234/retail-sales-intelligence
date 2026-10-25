from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats

NUMERIC = ["Sales", "Profit", "Quantity", "Discount", "Profit Margin", "Shipping Days"]


def overview(frame: pd.DataFrame) -> dict:
    return {
        "rows": int(len(frame)),
        "orders": int(frame["Order ID"].nunique()),
        "customers": int(frame["Customer ID"].nunique()),
        "products": int(frame["Product ID"].nunique()),
        "sales": float(frame["Sales"].sum()),
        "profit": float(frame["Profit"].sum()),
        "quantity": int(frame["Quantity"].sum()),
        "profit_margin": float(frame["Profit"].sum() / frame["Sales"].sum()) if frame["Sales"].sum() else None,
        "date_min": frame["Order Date"].min().date().isoformat() if len(frame) else None,
        "date_max": frame["Order Date"].max().date().isoformat() if len(frame) else None,
    }


def group_summary(frame: pd.DataFrame, column: str) -> list[dict]:
    grouped = (
        frame.groupby(column, dropna=False)
        .agg(
            sales=("Sales", "sum"),
            profit=("Profit", "sum"),
            quantity=("Quantity", "sum"),
            orders=("Order ID", "nunique"),
        )
        .reset_index()
    )
    grouped["margin"] = np.where(
        grouped["sales"] != 0,
        grouped["profit"] / grouped["sales"] * 100,
        np.nan,
    )
    return grouped.to_dict(orient="records")


def descriptive_stats(frame: pd.DataFrame) -> list[dict]:
    rows: list[dict] = []
    for col in NUMERIC:
        series = pd.to_numeric(frame[col], errors="coerce").dropna()
        if series.empty:
            continue
        counts = series.value_counts()
        mode_value = counts.index[0] if len(counts) and counts.iloc[0] > 1 else None
        sample_std = series.std(ddof=1) if len(series) >= 2 else None
        sample_variance = series.var(ddof=1) if len(series) >= 2 else None
        is_constant = series.nunique(dropna=True) <= 1
        skewness = stats.skew(series, bias=False) if len(series) > 2 and not is_constant else None
        kurtosis = stats.kurtosis(series, bias=False) if len(series) > 3 and not is_constant else None
        rows.append({
            "variable": col,
            "count": int(series.size),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "mode": float(mode_value) if mode_value is not None else None,
            "std": float(sample_std) if sample_std is not None and np.isfinite(sample_std) else None,
            "variance": float(sample_variance) if sample_variance is not None and np.isfinite(sample_variance) else None,
            "min": float(series.min()),
            "q1": float(series.quantile(0.25)),
            "q3": float(series.quantile(0.75)),
            "max": float(series.max()),
            "iqr": float(series.quantile(0.75) - series.quantile(0.25)),
            "skewness": float(skewness) if skewness is not None and np.isfinite(skewness) else None,
            "kurtosis": float(kurtosis) if kurtosis is not None and np.isfinite(kurtosis) else None,
        })
    return rows


def distributions(frame: pd.DataFrame, column: str, bins: int = 28) -> dict:
    if column not in NUMERIC:
        raise ValueError(f"Unsupported distribution column: {column}")
    series = pd.to_numeric(frame[column], errors="coerce").dropna()
    if len(series) == 0:
        return {"column": column, "bins": [], "counts": [], "n": 0}
    counts, edges = np.histogram(series.to_numpy(), bins=bins)
    centers = ((edges[:-1] + edges[1:]) / 2).tolist()
    return {"column": column, "bins": [float(x) for x in centers], "counts": [int(x) for x in counts], "n": int(len(series))}


def monthly_sales(frame: pd.DataFrame) -> list[dict]:
    if frame.empty:
        return []
    grouped = frame.groupby("Order Month", as_index=False)["Sales"].sum().sort_values("Order Month")
    start = pd.Period(str(grouped.iloc[0]["Order Month"]), freq="M")
    end = pd.Period(str(grouped.iloc[-1]["Order Month"]), freq="M")
    complete = grouped.set_index("Order Month")["Sales"]
    complete.index = pd.PeriodIndex(complete.index, freq="M")
    complete = complete.reindex(pd.period_range(start, end, freq="M"), fill_value=0.0)
    return [
        {"period": period.strftime("%Y-%m"), "sales": float(value)}
        for period, value in complete.items()
    ]


def yearly_sales(frame: pd.DataFrame) -> list[dict]:
    grouped = frame.groupby("Year", as_index=False)["Sales"].sum().sort_values("Year")
    return [{"period": str(int(r["Year"])), "sales": float(r["Sales"])} for _, r in grouped.iterrows()]


def quarterly_sales(frame: pd.DataFrame) -> list[dict]:
    temp = frame.assign(period=frame["Order Date"].dt.to_period("Q").astype(str))
    grouped = temp.groupby("period", as_index=False)["Sales"].sum().sort_values("period")
    return [{"period": str(r["period"]), "sales": float(r["Sales"])} for _, r in grouped.iterrows()]


def correlation(frame: pd.DataFrame) -> dict:
    cols = ["Sales", "Profit", "Quantity", "Discount"]
    mat = frame[cols].corr(method="pearson")
    return {"labels": cols, "matrix": [[None if pd.isna(v) else float(v) for v in row] for row in mat.to_numpy()]}


def scatter(frame: pd.DataFrame, x: str, y: str, max_points: int = 1600) -> dict:
    valid = frame[[x, y]].dropna().copy()
    if len(valid) > max_points:
        valid = valid.sample(max_points, random_state=42)
    return {
        "x": x, "y": y, "total": int(len(frame)), "sampled": int(len(valid)),
        "points": [{"x": float(row[x]), "y": float(row[y])} for _, row in valid.iterrows()],
    }
