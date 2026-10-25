# Final Repository Repair & One-Click Setup

## Purpose

This repair pass addresses the Windows validation failures found after the Node 24 installation and adds proactive checks for several classes of regression that can appear later in the TypeScript/React/ECharts codebase.

## Fixed frontend issues

- Removed unsupported `aria-label` usage on generic `<div>` loading/fallback elements.
- Replaced index-derived React keys in skeleton lists with stable identifiers.
- Kept loading/error/data-state handling deterministic so an API error is not hidden behind a loading branch.
- Reworked the dashboard ECharts tooltip formatter to accept the library's broader tooltip value type rather than a narrower `number` annotation.
- Removed direct state writes from effect bodies; state updates that belong to asynchronous callbacks remain inside those callbacks.
- Removed explicit `any` from application TypeScript/TSX.
- Removed TypeScript suppression directives.
- Kept TanStack Table on its current typed v9 API shape.
- Added a local-import gate so missing `@/`/relative modules are caught before the full TypeScript build.
- Added static checks for generic-element ARIA labels, index keys, narrow ECharts tooltip formatter signatures, and direct state setters inside effects.

## Fixed Windows bootstrap issues

`setup.bat` is the canonical Windows entry point. It invokes `scripts/setup.ps1`, which now:

1. Verifies Node 24.21.x and npm 11.19.x.
2. Verifies Python 3.13.x.
3. Recreates `backend/.venv` when its Python version is wrong.
4. Installs Python requirements and runs `pip check`.
5. Installs the frontend with `npm ci` when a lockfile exists, otherwise `npm install`.
6. Runs the repository doctor.
7. Runs both data truth gates and the Python test suite.
8. Runs Biome formatting before the quality checks.
9. Runs the complete frontend check/type-generation/import/static gate.
10. Builds Next.js.
11. Audits production JavaScript dependencies.
12. Starts FastAPI and Next.js only when their ports are free or already host the expected healthy project services.
13. Verifies FastAPI with an exact project health response and dataset row count.
14. Verifies Next.js by requesting `/command-center` and requiring HTTP 200.
15. Writes timestamped setup/service logs under `logs/`.
16. Opens the Command Center only after both services are healthy.

## Verification performed in the available environment

- `python scripts/verify_data.py` — PASS
- `python scripts/verify_truth.py` — PASS
- Python test suite — 6 passed
- Python compilation — PASS
- TypeScript/TSX parser/static gate — PASS (23 files)
- Local import gate — PASS (23 files)
- `git diff --check` — PASS

The available container does not contain the user's Windows Node 24 dependency tree, so this environment cannot claim an actual `npm run check` / `next build` execution under the user's Node 24.21.0 installation. The one-click bootstrap is designed to perform those checks on the Windows machine itself.

## One-click usage

After Node 24.21.x and Python 3.13.x are installed, double-click:

```text
setup.bat
```

All project setup, verification, build and local-service startup steps are logged to `logs/`.
