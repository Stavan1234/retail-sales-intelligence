# Final Windows Setup and TypeScript Fix

This release incorporates the fixes from the real Windows setup run.

## TypeScript fixes

- `app/explore/page.tsx`: restored the missing `useMemo` import.
- `app/statistics/page.tsx`: narrowed ECharts `TopLevelFormatterParams` before reading `params.value` and validated heatmap coordinates.
- `components/data/transaction-table.tsx`: uses `row.getAllCells()` because the table registers the base feature set without column-visibility support.
- `tsconfig.json`: includes `.next/dev/types/**/*.ts` so Next's route type generation does not keep rewriting the file.

These choices follow the current TanStack Table v9 and ECharts APIs. TanStack's current core exposes `getAllCells()` on the base Row API, while visible-cell helpers belong to the column-visibility feature. ECharts tooltip formatters receive either a single callback parameter or an array, so the formatter must narrow the union before accessing `.value`.

## Setup fixes

- Node 24.21.x and npm 11.19.x are checked before installation.
- Windows `npm.cmd` is resolved explicitly.
- Python 3.13.x is checked.
- Python dependencies are installed from the pinned lock requirements.
- `httpx2` is included because Starlette 1.7.0's TestClient uses it.
- `pip check` and the exact Python environment gate run before tests.
- Frontend installation verifies the lockfile and required executables (`biome`, `next`, `tsc`).
- A stale `package-lock.json` is moved to `logs/` rather than left in the repository root.
- Truth/data gates run before frontend build.
- Format runs before lint/typecheck.
- The production build and production-only npm audit run before service startup.
- FastAPI and Next.js are started only after the build succeeds.
- Live HTTP health checks validate the backend dataset row count and the frontend route.
- Setup logs and service stdout/stderr are stored under `logs/`.
- Setup cleans up processes it started if a later gate fails.

## Required Windows runtime

- Node.js 24.21.x LTS
- npm 11.19.x
- Python 3.13.x

## First run

Double-click `setup.bat`.

For a manual run:

```powershell
npm install
npm run doctor
npm run check
npm run build
```

Do not delete `package-lock.json` after the first successful installation.
