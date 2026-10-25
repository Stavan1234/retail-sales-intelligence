# Phase 6 — Command Center + Data Preparation

## Implemented

- Replaced placeholder Command Center with live FastAPI data.
- Replaced placeholder Data Preparation view with live data-quality output.
- Added a shared typed frontend API client.
- Added URL-backed global filters using the real `/api/filters` endpoint.
- Added responsive ECharts wrapper using ECharts core module registration.
- Added KPI, chart-card, state and section-heading presentation primitives.
- Added a data-preparation pipeline view and schema table.
- Removed date/filter drift by using `start_date` and `end_date`, matching FastAPI contracts.

## Data integrity rule

No analytical number is hardcoded in the frontend. All KPIs, charts, quality counts, date bounds and filter options come from the Python/FastAPI layer.

## Local run

1. Start FastAPI from the repository root:

   `python -m uvicorn backend.app.main:app --reload --port 8000`

2. Set `NEXT_PUBLIC_API_BASE_URL` to the FastAPI URL if it differs from the default.

3. Install frontend dependencies with Node 24 LTS:

   `npm install`

4. Start Next.js:

   `npm run dev`

## Verification boundary

The environment used to produce Phase 6 does not contain the frontend `node_modules` tree and cannot reach npmjs.org. Therefore the TypeScript/Next build was not claimed as executed here. The implementation was written against the Phase 1 locked stack and the existing FastAPI contracts. The final exact-environment build remains part of Phase 12 QA.
