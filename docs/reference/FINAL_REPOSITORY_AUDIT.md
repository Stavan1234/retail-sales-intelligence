# Final Repository Audit

Status: **REPAIRED — READY FOR WINDOWS NODE 24 VERIFICATION**

## Trigger

The target Windows machine successfully installed the project under Node 24.21.0 / npm 11.19.0, but the first `npm run check` exposed four Biome diagnostics: unsupported `aria-label` usage on generic `<div>` elements and a React key derived from a map index. The same audit also reviewed likely follow-on TypeScript/ECharts/React/tooling failures before they could surface later.

## Current frontend repair

- Removed unsupported ARIA labels from generic loading/fallback `<div>` elements and used semantic status announcements instead.
- Replaced index-derived skeleton keys with stable identifiers.
- Removed the narrow `(value: number)` annotation from an ECharts tooltip formatter; the callback now handles the library's broader value type safely.
- Removed explicit `any` from application TypeScript/TSX.
- Kept state writes out of effect bodies; asynchronous setters remain inside asynchronous callbacks.
- Kept effect dependencies stable without `JSON.stringify(filters)` in dependency arrays.
- Added local-import validation for `@/` and relative TypeScript/TSX imports.
- Added static regression checks for ARIA labels, index keys, narrow ECharts value formatters, explicit `any`, TypeScript suppressions and direct state setters in effects.
- Kept TanStack Table on the current typed v9 API shape.
- Added semantic card headings with explicit margin reset so native `<h2>` defaults do not distort layout.
- Preserved reduced-motion behavior for both Motion and ECharts.

## Windows bootstrap repair

`setup.bat` is now the canonical one-click entry point.

It:

1. checks Node 24.21.x and npm 11.19.x;
2. checks Python 3.13.x;
3. recreates `backend/.venv` when its Python version is wrong;
4. installs Python dependencies and runs `pip check`;
5. installs frontend dependencies with `npm ci` when a lockfile exists, otherwise `npm install`;
6. runs the repository doctor;
7. runs data and analytical truth gates;
8. runs Python tests;
9. formats the frontend source;
10. runs the full frontend check including Next route type generation, local-import validation, static source validation and TypeScript compilation;
11. builds Next.js;
12. audits production JavaScript dependencies;
13. starts FastAPI and Next.js only when their ports are free or already serve the expected healthy services;
14. verifies the backend health response and exact 10,194-row source baseline;
15. verifies `/command-center` returns HTTP 200;
16. writes timestamped setup/backend/frontend logs under `logs/`; and
17. opens the Command Center only after the services are healthy.

The setup script intentionally does not attempt to install system runtimes. Those are machine-level prerequisites; the project setup itself is automated.

## Verification performed in the available environment

```text
PHASE 0 DATA VERIFICATION      PASS
PHASE 11 TRUTH GATE            PASS
PYTHON TEST SUITE              6 passed
PYTHON COMPILE                 PASS
LOCAL IMPORT GATE              PASS (23 files)
FRONTEND STATIC GATE           PASS (23 files)
GIT DIFF CHECK                 PASS
```

The container still runs Node 22 and does not have access to the user's Windows dependency tree or the npm registry, so an actual Node 24 `npm run check` / `npm run build` cannot honestly be claimed from the container. The Windows machine has already proven that Node 24.21.0 / npm 11.19.0 installation succeeds; the repaired `setup.bat` is the final automated target-machine gate.

## Source-of-truth baseline

The canonical dataset remains the supplied workbook and processed CSV. The truth gate continues to enforce:

```text
Orders                 10,194 × 21
Processed              10,194 × 31
Distinct orders          5,111
Distinct customers         804
Distinct products        1,862
Total sales        2,326,534.3543
Total profit         292,296.8146
Total quantity           38,654
Order dates        2023-01-03 → 2026-12-30
```

No dashboard values are hardcoded as the source of truth.

## Recommended user workflow

For the Windows project directory, use:

```text
setup.bat
```

For manual development, keep the generated `package-lock.json` and use:

```powershell
npm run doctor
npm run check
npm run build
npm run dev
```
