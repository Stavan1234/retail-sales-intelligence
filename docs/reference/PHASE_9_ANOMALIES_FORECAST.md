# Phase 9 — Anomalies & Forecast

## Scope

Complete the final analytical workspace by exposing the already-verified anomaly detectors and the Phase 3 time-series forecast through a single investigation-first interface.

## Delivered

### Anomaly investigation
- IQR anomaly counts for Sales and Profit.
- Z-score anomaly counts for Sales and Profit using |z| > 3.
- Isolation Forest using Sales, Quantity, Discount and Profit.
- Method-comparison visualization.
- Flagged transaction table sorted by anomaly score.
- Search across order, customer, product, category, region and segment.
- Explicit "flagged for investigation" wording.

The UI deliberately avoids labeling statistical outliers as bad data. This follows the project's source plan that anomalies may be legitimate large orders, unusually profitable transactions, deeply discounted sales, loss-making orders, or data-quality issues. fileciteturn2file6

### Forecast workspace
- 48 months of historical Sales.
- 3-month rolling trend.
- Holt-Winters historical + forecast line.
- Six-month forecast for Jan–Jun 2027.
- 80% and 95% uncertainty bands.
- Model/benchmark comparison.
- Validation MAE/RMSE display.
- Directional forecast summary.

The point forecast reproduces the frozen Phase 3 reference values:

- 2027-01: 51,137.36
- 2027-02: 43,082.35
- 2027-03: 77,516.86
- 2027-04: 62,983.48
- 2027-05: 70,406.72
- 2027-06: 67,036.31

The uncertainty bands are simulation/bootstrap-based and are clipped at zero because monthly sales totals cannot be negative.

## UX decisions

- Global filters apply to both anomaly and forecast analysis.
- The two analytical modes are tabs in one workspace rather than separate sidebar pages.
- The forecast chart shows uncertainty explicitly instead of displaying a single authoritative-looking line.
- Motion is used only for mode/content transitions; data visualization itself is not animated unnecessarily.
- The table is bounded to a readable number of rows in the browser.

Motion's current React integration uses `motion/react`; the project follows that integration pattern. citeturn797653search0

## Backend truth

The frontend makes no anomaly or forecast calculations. It consumes `/api/anomalies` and `/api/forecast`, which in turn use the Python analytics layer.

The source-of-truth chain remains:

```text
Frozen Excel
   ↓
Python analytics
   ↓
FastAPI
   ↓
Next.js UI
```

## Verification

```text
pytest                         PASS (3 tests)
API smoke: /api/anomalies     PASS
API smoke: /api/forecast      PASS
Forecast point values         PASS vs Phase 3 baseline
Forecast history              48 months
Forecast horizon              6 months
Data verification             PASS
```

## Current environment boundary

The execution environment still has Node 22 and does not have the frontend npm dependency tree installed. Therefore this phase does not claim a local Next.js/TypeScript production build. Exact frontend dependency installation remains part of final-environment QA.

## Source note

The project plan calls for five primary sections and an Anomalies & Forecast workspace containing IQR, Z-score, Isolation Forest, anomaly investigation, historical sales and forecast uncertainty. fileciteturn2file6
