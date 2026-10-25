# Phase 4 — FastAPI API Layer

## Goal

Expose the Python analytics engine through a small, typed API contract that the Next.js frontend can consume without reimplementing business calculations in TypeScript.

## Architecture

```text
Authoritative Excel
       ↓
DatasetService (load once at lifespan startup)
       ↓
Reusable Python analytics modules
       ↓
FastAPI routes
       ↓
Pydantic response models
       ↓
Next.js frontend (Phase 5+)
```

## Endpoints

```text
GET /api/health
GET /api/filters
GET /api/overview
GET /api/data-quality
GET /api/explore
GET /api/statistics
GET /api/tests
GET /api/regression
GET /api/anomalies
GET /api/forecast
```

Supported analysis filters are `year`, `region`, `category`, `segment`, `start_date`, and `end_date`.

## Important implementation choices

- The authoritative workbook is loaded once using FastAPI's `lifespan` mechanism.
- Pydantic v2 models are used for response validation and generated OpenAPI documentation.
- CORS explicitly allows local frontend origins instead of `*`.
- The API has no database and does not persist user data.
- The scatter endpoints return a deterministic maximum sample for payload control; the response reports both total rows and sampled rows.
- Forecasting uses the Phase 3 analytics implementation and is rejected when the filtered series is too short.
- The API does not contain hardcoded dashboard KPI values.

## Version note

Phase 4 targets:

- FastAPI 0.135.4
- Pydantic 2.13.5
- Uvicorn 0.54.0

These were checked against current PyPI release metadata on 2026-10-04. The application uses stable APIs documented by FastAPI for `lifespan`, `CORSMiddleware`, and Pydantic response typing.

## Verification

Phase 4 tests validate:

- health and dataset dimensions
- filter option values
- real filtered overview metrics
- statistical response contract
- regression/anomaly/forecast contracts
- invalid filter behavior

The tests use the currently installed environment in this workspace. Exact pinned dependency installation must still be verified under the project's Python 3.13 environment.
