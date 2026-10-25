# Retail Sales Intelligence — Clean Release

This release fixes the Windows setup/quality-gate issues surfaced during real execution.

## Fixed

- Biome 2.5 format-check command now uses `biome ci` with formatter-only checking.
- pandas 3 string-dtype migration warning is removed from `select_dtypes` usage.
- TypeScript helper scripts use native ESM loading instead of CommonJS `require()`.
- Node 24.21.x / npm 11.19.x and Python 3.13.x remain the enforced runtime baseline.
- FastAPI TestClient dependency is pinned to the Starlette 1.7 `httpx2` requirement.
- Setup logs are written to `logs/` and service output is captured separately.
- Setup uses the existing lockfile with `npm ci` when available and only generates a new lockfile when one is absent.
- Setup performs truth, Python environment, frontend static, format, type, build and live-service gates before reporting success.

## Clean installation

Use Node 24.21.x LTS and Python 3.13.x.

From the repository root, double-click `setup.bat`.

For a later repeat setup, keep the generated `package-lock.json` and `backend/.venv`; the script will reuse them when valid.

## Verification performed in the build environment

- Dataset truth gate: PASS
- Analytical truth gate: PASS
- Python tests: 9 passed
- Python compilation: PASS
- Node script syntax: PASS

The exact Windows Node dependency installation/build must be verified by `setup.bat` on the user's Windows machine because this build environment cannot run the user's installed Windows Node toolchain.
