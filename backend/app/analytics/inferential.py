from __future__ import annotations

import pandas as pd
from scipy import stats
from statsmodels.stats.multicomp import pairwise_tukeyhsd

ALPHA = 0.05


def _require_non_empty(series: pd.Series, message: str) -> pd.Series:
    clean = series.dropna().astype(float)
    if clean.empty:
        raise ValueError(message)
    return clean


def confidence_interval(frame: pd.DataFrame, confidence: float = 0.95) -> dict:
    if not 0 < confidence < 1:
        raise ValueError("confidence must be between 0 and 1")

    series = _require_non_empty(frame["Sales"], "At least two Sales observations are required")
    n = len(series)
    if n < 2:
        raise ValueError("At least two Sales observations are required for a confidence interval")
    mean = float(series.mean())
    sem = float(stats.sem(series))
    margin = float(stats.t.ppf((1 + confidence) / 2, n - 1) * sem)

    return {
        "question": "What is the plausible range for the population mean Sales?",
        "sample_size": n,
        "mean": mean,
        "standard_error": sem,
        "confidence": confidence,
        "margin_of_error": margin,
        "lower": mean - margin,
        "upper": mean + margin,
    }


def welch_test(frame: pd.DataFrame) -> dict:
    a = _require_non_empty(
        frame.loc[frame["Segment"] == "Consumer", "Sales"],
        "The selected scope does not contain enough Consumer Sales observations",
    )
    b = _require_non_empty(
        frame.loc[frame["Segment"] == "Corporate", "Sales"],
        "The selected scope does not contain enough Corporate Sales observations",
    )
    if len(a) < 2 or len(b) < 2:
        raise ValueError("The Welch t-test requires at least two observations in each comparison group")

    result = stats.ttest_ind(a, b, equal_var=False)
    if not pd.notna(result.statistic) or not pd.notna(result.pvalue) or not pd.notna(result.df):
        raise ValueError("The Welch t-test is undefined for the selected comparison groups")
    p_value = float(result.pvalue)
    return {
        "question": "Do Consumer and Corporate segments have different mean Sales?",
        "null": "Mean Consumer Sales = Mean Corporate Sales",
        "alternative": "Mean Consumer Sales ≠ Mean Corporate Sales",
        "alpha": ALPHA,
        "group_a": "Consumer",
        "group_b": "Corporate",
        "n_a": len(a),
        "n_b": len(b),
        "mean_a": float(a.mean()),
        "mean_b": float(b.mean()),
        "std_a": float(a.std(ddof=1)),
        "std_b": float(b.std(ddof=1)),
        "t_statistic": float(result.statistic),
        "p_value": p_value,
        "df": float(result.df),
        "decision": "Reject H0" if p_value < ALPHA else "Fail to Reject H0",
    }


def anova(frame: pd.DataFrame) -> dict:
    groups = []
    for _, group in frame.groupby("Category", dropna=True):
        profits = group["Profit"].dropna().astype(float)
        if len(profits) >= 2:
            groups.append(profits)

    if len(groups) < 2:
        raise ValueError("ANOVA requires at least two product categories with two observations each")

    result = stats.f_oneway(*groups)
    if not pd.notna(result.statistic) or not pd.notna(result.pvalue):
        raise ValueError("ANOVA is undefined for the selected product-category values")
    p_value = float(result.pvalue)
    valid_categories = frame.groupby("Category", dropna=True)["Profit"].count()
    valid_categories = valid_categories[valid_categories >= 2].index
    means = (
        frame[frame["Category"].isin(valid_categories)]
        .groupby("Category", dropna=True)["Profit"]
        .agg(["count", "mean", "std"])
        .reset_index()
    )

    return {
        "question": "Does mean Profit differ across product categories?",
        "null": "All category mean profits are equal",
        "alternative": "At least one category mean profit differs",
        "alpha": ALPHA,
        "f_statistic": float(result.statistic),
        "p_value": p_value,
        "df_between": len(groups) - 1,
        "df_within": int(sum(len(group) for group in groups) - len(groups)),
        "groups": means.rename(
            columns={"mean": "mean_profit", "std": "std_profit"},
        ).to_dict(orient="records"),
        "decision": "Reject H0" if p_value < ALPHA else "Fail to Reject H0",
    }


def tukey(frame: pd.DataFrame) -> list[dict]:
    clean = frame[["Category", "Profit"]].dropna()
    if clean["Category"].nunique() < 2:
        raise ValueError("Tukey HSD requires at least two product categories")

    group_sizes = clean.groupby("Category")["Profit"].size()
    if (group_sizes < 2).any():
        raise ValueError("Tukey HSD requires at least two observations in every comparison group")

    result = pairwise_tukeyhsd(clean["Profit"].astype(float), clean["Category"].astype(str), alpha=ALPHA)
    rows = []
    for row in result.summary().data[1:]:
        rows.append(
            {
                "group1": str(row[0]),
                "group2": str(row[1]),
                "mean_difference": float(row[2]),
                "p_adj": float(row[3]),
                "lower": float(row[4]),
                "upper": float(row[5]),
                "reject": bool(row[6]),
            }
        )
    return rows


def chi_square(frame: pd.DataFrame) -> dict:
    clean = frame[["Segment", "Category"]].dropna()
    observed = pd.crosstab(clean["Segment"], clean["Category"])
    if observed.shape[0] < 2 or observed.shape[1] < 2:
        raise ValueError("Chi-square requires at least two segments and two categories in the selected scope")

    result = stats.chi2_contingency(observed)
    expected = pd.DataFrame(result.expected_freq, index=observed.index, columns=observed.columns)
    min_expected = float(expected.to_numpy().min())
    warning = min_expected < 5
    p_value = float(result.pvalue)

    return {
        "question": "Is Customer Segment associated with Product Category?",
        "null": "Customer Segment and Product Category are independent",
        "alternative": "Customer Segment and Product Category are associated",
        "alpha": ALPHA,
        "chi_square": float(result.statistic),
        "p_value": p_value,
        "df": int(result.dof),
        "labels_row": [str(value) for value in observed.index],
        "labels_col": [str(value) for value in observed.columns],
        "observed": observed.to_numpy().astype(int).tolist(),
        "expected": [[float(value) for value in row] for row in expected.to_numpy()],
        "min_expected": min_expected,
        "assumption_warning": warning,
        "decision": "Reject H0" if p_value < ALPHA else "Fail to Reject H0",
    }
