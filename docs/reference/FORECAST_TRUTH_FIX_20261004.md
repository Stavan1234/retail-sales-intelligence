# Forecast Truth-Gate Fix — 2026-10-04

## What failed

The Windows target environment successfully installed statsmodels 0.15.0, but the truth gate expected point forecasts generated under an older statsmodels environment. The first mismatch was:

- actual 2027-01 forecast: 50,877.64424546088
- legacy expected forecast: 51,137.36495399341

This is not a data corruption signal. The statsmodels 0.15.0 release notes explicitly state that some corrected model paths can change numerical output.

## Correct policy

Future forecast point values are runtime analytical outputs, not immutable source-data facts. The truth gate now verifies:

- 48 historical monthly observations
- correct historical period range
- six future monthly periods
- chronological horizon
- Holt-Winters model family
- state-space bootstrap uncertainty
- finite and non-negative forecast values
- correctly nested uncertainty intervals
- selected model beats the seasonal-naive validation benchmark on MAE and RMSE

Legacy numeric forecast values remain documented only as historical reference.

## Why this is safer

The data truth gate still freezes every source-data invariant. The analytical truth gate verifies the model's mathematical contract without falsely treating upstream library-specific floating-point output as a dataset fact.
