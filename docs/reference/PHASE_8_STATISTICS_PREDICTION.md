# Phase 8 — Statistics & Prediction

## Scope

Replace the Statistics & Prediction placeholder with a real evidence workspace backed by the Phase 2 analytics engine and Phase 4 API.

## Implemented

### Inferential statistics
- 95% confidence interval for mean Sales
- Welch independent t-test: Consumer vs Corporate Sales
- one-way ANOVA: Profit across Furniture, Office Supplies and Technology
- Tukey HSD post-hoc comparisons
- chi-square test of independence: Customer Segment × Product Category
- group sample sizes, means and standard deviations
- degrees of freedom where applicable
- chi-square assumption warning when an expected cell is below 5

### Regression
- Simple Linear Regression: Quantity → Sales
- Multiple Linear Regression using Quantity, Discount, Category, Sub-Category, Region and Segment
- leakage-safe categorical preprocessing through scikit-learn Pipeline + ColumnTransformer
- MAE, MSE, RMSE and R²
- residuals
- actual vs predicted data
- top coefficients
- 5-fold cross-validation for both models
- mean and spread of CV R²/MAE/RMSE
- simple regression equation

## UI structure

The Statistics & Prediction page has two top-level views:

1. Statistical testing
2. Regression

Regression is conditionally fetched only when the user opens the Regression view because it performs ten model fits across two models (5 folds each) in addition to the normal train/test evaluation.

The page uses the existing ECharts engine and the project's shared Card/Button/Badge primitives. No separate charting library was introduced.

## Analytical behavior

### Hypothesis results

The UI explicitly distinguishes:
- H0 and H1
- p-value vs alpha
- Reject H0 vs Fail to Reject H0
- statistical evidence vs causation

### ANOVA

The UI shows category means and then Tukey HSD pairwise results. This preserves the notebook's workflow rather than presenting Tukey as a standalone test.

### Chi-square

The UI shows an observed-count heatmap. Expected frequencies are retained in the API response so the statistical layer can expose assumption checks without requiring the frontend to recompute the test.

### Regression validation

Cross-validation uses `KFold(n_splits=5, shuffle=True, random_state=42)` for transaction-level tabular regression. The time-series forecasting module remains separately validated with temporal holdout; the two validation strategies are not mixed.

The frontend shows both the held-out test-set metrics and cross-validation stability so a single split does not become the only claim about model quality.

## Important source-of-truth rule

The website receives all statistical and regression results from FastAPI. The TypeScript layer does not reproduce statistical formulas or machine-learning calculations.

## Reference results from the supplied dataset

Held-out regression metrics remain consistent with the frozen notebook baseline:

- Simple Linear Regression: MAE ≈ 266.34, RMSE ≈ 709.94, R² ≈ 0.0345
- Multiple Linear Regression: MAE ≈ 223.66, RMSE ≈ 634.77, R² ≈ 0.2281

The supplied notebook/reference values were preserved; the new cross-validation fields are additional validation evidence computed by the reusable engine.

## Current-library verification

Implementation follows the current scikit-learn 1.9.1 cross-validation API. The official documentation describes `cross_validate` for multiple metrics and `KFold(n_splits=5)` as the standard five-fold splitter. The project uses a pipeline so preprocessing is refit inside each fold rather than performed once on the complete dataset before validation.

SciPy's current `ttest_ind` result exposes the test statistic, p-value and degrees of freedom; Welch's test is selected with `equal_var=False`.

Statsmodels 0.15 adds `use_var` support to `pairwise_tukeyhsd`; the project intentionally keeps the notebook's standard Tukey-HSD behavior for consistency and does not silently switch the academic result to Games-Howell.

## Verification

```text
Python compileall       PASS
pytest                  18 passed
API /api/tests          PASS
API /api/regression     PASS
git diff --check         PASS
```

The Node/Next build remains dependent on installing the Phase 1 locked frontend dependency graph under Node 24 LTS; the current execution environment does not have the npm dependency tree installed.
