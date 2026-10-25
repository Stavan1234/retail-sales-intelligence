# Phase 0 — Source Freeze & Truth Baseline

Status: **COMPLETE**

This file records the frozen inputs used to build the Retail Sales Intelligence application.

## Frozen sources

- `data/source/sample_-_superstore.xlsx` — source workbook
- `data/processed/superstore_processed.csv` — processed dataset currently used by the notebook
- `notebooks/ADS_Mini_Project.ipynb` — current academic analysis
- `docs/reference/Retail_Sales_Analytics_Master_Project_Plan.md` — implementation/UI/architecture plan
- `docs/reference/ADS_Mini_Project_Rendered_Current.pdf` — current rendered notebook snapshot

SHA-256 hashes and numerical baselines are recorded in `data/baseline.json`.

## Verified dataset facts

The source workbook currently contains:

- Orders: 10,194 rows × 21 columns
- Returns: 296 data rows
- People: 4 data rows
- Distinct orders: 5,111
- Distinct customers: 804
- Distinct products: 1,862
- Total sales: 2,326,534.3543
- Total profit: 292,296.8146
- Total quantity: 38,654
- Order-date range: 2023-01-03 through 2026-12-30
- Missing values in Orders: 0
- Duplicate rows in Orders: 0

The processed CSV contains 31 columns, consisting of the original 21 fields plus 10 engineered fields.

## Integrity checks

`python scripts/verify_data.py` verifies:

1. Source workbook schema and row counts.
2. Processed CSV schema and row counts.
3. Missing/duplicate invariants.
4. Core totals and cardinalities.
5. Return Order IDs are present in Orders.
6. People sheet regions match Orders regions.
7. All 21 raw fields in the processed CSV still match the source workbook row-by-row.
8. All 10 engineered fields match independent recomputation from the raw Orders sheet.

## Analytical baseline

The notebook's currently executed results are preserved in `data/baseline.json`, including the confidence interval, hypothesis tests, regression metrics, and anomaly counts.

These are **baseline reference values**, not values that should be hardcoded into the application. The eventual API/UI must calculate from the source data.

## Known gap

The current notebook does not yet contain the complete forecasting module. This remains a later implementation phase. The current rendered PDF is also incomplete relative to the latest notebook state.

## Data interpretation caution

The date range extends through 2026-12-30. That is a fact of the supplied dataset and must not be silently rewritten. The application should describe the coverage exactly rather than implying that the data represents real-world transactions only up to the current system date.
