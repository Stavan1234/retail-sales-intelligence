# Phase 3 — Time Series Forecasting

## Purpose

Complete the missing forecasting module identified in the master project plan while preserving the frozen Superstore dataset and the existing notebook/analytics truth.

## Method

1. Aggregate order-level `Sales` by `Order Month`.
2. Preserve all 48 complete monthly observations from January 2023 through December 2026.
3. Hold out the final 12 months (January–December 2026) for temporal validation.
4. Compare a small, explicit set of Holt-Winters configurations:
   - additive trend + additive seasonality
   - damped additive trend + additive seasonality
   - additive trend + multiplicative seasonality
   - damped additive trend + multiplicative seasonality
5. Compare the selected Holt-Winters model against a seasonal-naive benchmark.
6. Select by validation MAE, with RMSE as the tie-breaker.
7. Refit the selected model on all 48 months.
8. Forecast the next 6 calendar months: January–June 2027.
9. Generate 80% and 95% state-space simulation intervals with bootstrap errors using a deterministic random seed.

This stays inside one model family instead of building a model zoo. The seasonal-naive forecast is used only as a simple sanity benchmark.

## Result on the frozen dataset

Selected model:

> Holt-Winters additive trend + additive seasonality

Validation performance on the final 12 months:

| Metric | Holt-Winters | Seasonal-naive |
|---|---:|---:|
| MAE | 11,021.31 | 15,793.23 |
| RMSE | 14,689.47 | 19,440.50 |
| sMAPE | 19.36% | 28.81% |

The selected model therefore improves on the seasonal-naive benchmark for both MAE and RMSE on the held-out year.

### Six-month point forecast

The six-month values are generated at runtime from the pinned statsmodels 0.15.0 environment. The earlier Phase 3 reference values were produced under statsmodels 0.14.6 and are retained only as historical context; they are not used as exact truth-gate assertions. Statsmodels 0.15 explicitly notes that bug fixes can change numerical output for affected models. citeturn161586search4

## Uncertainty

The forecast UI displays uncertainty rather than implying certainty. The implementation uses statsmodels Holt-Winters state-space simulation with bootstrap errors. The statsmodels 0.15 release standardizes random-number-generator handling around the `rng` keyword; the implementation includes a compatibility branch for older development environments while targeting 0.15.0. citeturn811277search0turn767599view0

The 80% and 95% bands are clipped at zero because monthly sales totals cannot be negative. This is a presentation/physical-constraint safeguard, not a claim that the underlying interval distribution is inherently truncated.

## Why this implementation

Statsmodels documents Holt-Winters / Exponential Smoothing as supporting explicit trend and seasonal components, and its simulation functionality can generate future paths and uncertainty information. citeturn984343search5turn984343search9

The project uses temporal validation instead of random train/test splitting. Scikit-learn documents `TimeSeriesSplit` for time-ordered data because ordinary cross-validation can train on future observations and evaluate on past observations. citeturn984343search0

## Verification

- `python -m py_compile backend/app/analytics/forecasting.py` — PASS
- phase-wide pytest suite — **9 passed**
- isolated execution of the new notebook forecasting section — PASS
- frozen dataset monthly series remains 48 observations from `2023-01` through `2026-12`

## Environment note

The repository targets statsmodels 0.15.0. The execution environment available during this phase currently provides statsmodels 0.14.6, so numerical execution was checked against the compatible API and the code includes a small compatibility branch for the RNG keyword. Exact future point values are intentionally not used as a cross-version truth assertion; the truth gate verifies the forecast contract, chronological horizon, finite/non-negative values, ordered intervals, and superiority to the seasonal-naive validation benchmark.

## Scope boundary

This phase does **not** add ARIMA, Prophet, LSTM, XGBoost, or other additional forecasting models. More models would add complexity without improving the current ADS objective.
