# Phase 2 — Python Analytics Engine

## Status

**Complete.**

## Purpose

Extract the analytical behavior of `notebooks/ADS_Mini_Project.ipynb` into reusable Python modules without changing the supplied dataset or inventing results.

## Implemented

### Data / preprocessing

- Loads the authoritative `Orders` sheet from the supplied workbook.
- Validates the required 21-column schema.
- Produces deterministic data-quality diagnostics.
- Recreates the notebook's 10 engineered fields:
  - Year
  - Month
  - Month Name
  - Quarter
  - Day
  - Day of Week
  - Week
  - Profit Margin
  - Shipping Days
  - Order Month
- Provides a canonical processed dataframe path for later API work.

### Descriptive analytics

- Distribution statistics.
- Full descriptive-statistics table.
- Category / sub-category / region / segment aggregation.
- Category and regional average profit margin.
- Sales / Profit / Quantity / Discount correlation matrix.
- Monthly, quarterly, and yearly sales series.
- EDA summary metrics.

### Inferential statistics

- 95% t-based confidence interval for mean Sales.
- Welch independent t-test for Consumer vs Corporate Sales.
- One-way ANOVA for Profit by Category.
- Tukey HSD post-hoc comparisons.
- Chi-square independence test for Segment × Category, including expected counts.

### Regression

- Simple linear regression: Quantity → Sales.
- Multiple linear regression using:
  - Quantity
  - Discount
  - Category
  - Sub-Category
  - Region
  - Segment
- MAE, MSE, RMSE, and R².
- Actual/predicted result tables.
- Coefficient ranking.

The multiple-regression implementation uses `ColumnTransformer` + `OneHotEncoder` inside a scikit-learn `Pipeline`. This preserves the notebook's effective feature space while using the standard leakage-safe preprocessing pattern documented by scikit-learn.

### Anomaly detection

- IQR outliers for Sales and Profit.
- Z-score outliers for Sales and Profit with threshold 3.
- Isolation Forest using Sales, Quantity, Discount, and Profit.
- Method comparison table.
- Ranked anomalous observations.

Isolation Forest keeps the notebook's `n_estimators=200`, `contamination='auto'`, and `random_state=42` settings for baseline reproducibility.

### Forecast preparation

- Canonical monthly-sales aggregation exists in `forecasting.py`.
- Full model fitting, temporal validation, and future forecasting are intentionally deferred to **Phase 3**.

## Verification

Executed successfully in the available Python 3.13 environment:

```text
scripts/verify_data.py        PASS
python -m compileall backend   PASS
pytest backend/app/tests/...  8 passed
```

The test suite verifies source-data metrics and the current notebook's analytical reference results, within the precision represented by the frozen baseline.

## Current environment limitation

The execution environment used for Phase 2 has older installed scientific packages than the pinned project baseline. Therefore the code was executed against the available compatible APIs, while the project requirements pin the current stable versions selected for the eventual Python 3.13 environment.

Pinned baseline:

```text
numpy==2.5.3
pandas==3.0.6
scipy==1.18.1
scikit-learn==1.9.1
statsmodels==0.15.0
openpyxl==3.1.5
pytest==9.0.2
```

These choices were checked against current official release information during Phase 2 planning.

## Not changed

- Supplied Excel source.
- Supplied processed CSV.
- Supplied notebook.
- Existing project baseline metrics.
- Frontend application code.
- Final ZIP packaging.

## Next phase

**Phase 3 — Forecasting Completion**

Implement and validate the monthly Holt-Winters / Exponential Smoothing forecasting workflow, including temporal validation, evaluation, uncertainty, and the final six-month forecast.
