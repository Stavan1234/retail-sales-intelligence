# Phase 7 — Explore & Visualize

## Scope

Phase 7 turns the descriptive-analysis material from the ADS notebook into a controlled interactive workspace. The interface is tabbed rather than creating a separate page for every chart.

## Delivered

### Overview
- Sales, Profit, Quantity and Discount histograms generated from real filtered data.
- Sales and Profit five-number boxplots.
- Distribution metadata remains visible alongside the charts.

### Group analysis
- Sales vs Profit by Category.
- Sales vs Profit by Region.
- Sales vs Profit by Customer Segment.

### Relationships
- Sales vs Profit scatter.
- Discount vs Profit scatter.
- Quantity vs Sales scatter.
- Pearson correlation heatmap for Sales, Profit, Quantity and Discount.

### Statistics
- Mean, median, mode, standard deviation, variance, min, max, IQR, skewness and kurtosis table.
- Short explanations of center, spread, shape and range.
- Server-backed transaction exploration with search, sorting, pagination and row inspection.

## API changes

`GET /api/explore` now includes an 18-bin histogram for each core numeric distribution.

`GET /api/data` was added because the application should not ship all 10,194 records to the browser just to render a data table. The endpoint supports:

- global dataset filters shared with the rest of the application;
- bounded page sizes (10, 25, 50, 100);
- case-insensitive search across common identifiers and business descriptors;
- whitelisted server-side sorting;
- paginated transaction records.

The backend deliberately keeps this endpoint small and bounded. The frontend never loads the complete transaction dataset.

## Table implementation

The transaction table uses TanStack Table v9's current React API. Sorting is manual/server-side: the table owns the sorting interaction while FastAPI performs the actual ordering over the full filtered dataset. This follows TanStack's current recommendation for server-side sorting rather than sorting only the currently loaded page.

## Verification

Backend suite:

- Phase 0 truth verification: PASS
- Phase 2 analytics tests: PASS
- Phase 7 Explore/Data contracts: PASS
- Python compilation: PASS
- `git diff --check`: PASS

Frontend dependency installation/build was not claimed in this environment because the npm registry is unavailable and the required `node_modules` tree is not installed here. The frontend source targets the Phase 1 toolchain and current TanStack Table v9 API.
