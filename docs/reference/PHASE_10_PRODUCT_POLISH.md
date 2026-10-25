# Phase 10 — Product Polish & Frontend Reconciliation

## Scope

Reconcile the five application surfaces against the real FastAPI contracts and add product-level usability/accessibility polish without expanding the analytical scope.

## Completed

- Replaced placeholder Command Center page with live overview/trend/category/region views.
- Replaced placeholder Data Preparation page with live quality metrics, processing pipeline and derived-field inventory.
- Replaced placeholder Explore page with distribution, group, relationship, descriptive-statistics and server-side transaction views.
- Replaced placeholder Statistics page with live CI, Welch t-test, ANOVA/Tukey, chi-square and regression views.
- Refined Anomalies & Forecast page with lazy per-tab requests, investigation queue, model comparison and uncertainty-aware forecast.
- Added App Router `loading.tsx` and `error.tsx` boundaries.
- Added site-wide `MotionConfig reducedMotion="user"` and restrained transitions. Motion documents this as the supported way to respect device reduced-motion preferences. See: https://motion.dev/docs/react-motion-config
- Added chart accessibility labels and ECharts ARIA configuration.
- Added abortable API requests to prevent stale results after filter changes.
- Improved global filter accessibility and date constraints.
- Removed inactive header controls that had no behavior.
- Removed generated Python caches from version control and expanded `.gitignore`.
- Removed an unused empty analytics service module.
- Updated README for the actual architecture and local run flow.

## Important implementation choices

- Do not render all 10,194 transaction rows in the browser.
- Server-side filtering/search/sorting/pagination remain the data-table strategy.
- ECharts remains the single charting engine.
- Analytical values continue to originate from the Python API.
- UI copy distinguishes association from causation and anomaly flags from data-quality errors.

TanStack's current v9 documentation explicitly supports server-side pagination/sorting and headless rendering, which is consistent with the API-owned table strategy. See: https://tanstack.com/table/latest/docs/guide/client-side-vs-server-side

React 19.3's stable ViewTransition API is available, but it is not introduced here because the simpler Motion + CSS transition layer already solves the required interaction problem without another moving part. See: https://react.dev/blog/2026/09/09/react-19-3

## Verification in this environment

- `python -m pytest -q` → PASS
- `python -m compileall -q backend` → PASS
- `python scripts/verify_data.py` → PASS
- `git diff --check` → PASS

The environment does not contain the project's Node 24 dependency tree and cannot reach the npm registry. Therefore an actual `npm run check` / `npm run build` is intentionally **not claimed as passed** here.

The repository's previous `package-lock.json` was generated for the original Create Next App dependency set and is no longer a truthful lockfile for the updated `package.json`. It is therefore not used as a source of truth. A fresh `npm install` under Node 24 should generate the matching lockfile before final release packaging.
