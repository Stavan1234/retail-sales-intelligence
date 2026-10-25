# Repository Repair — Windows Install / TypeScript Follow-up

Date: 2026-10-04

## Root cause from the supplied Windows log

The machine was running Node.js v22.17.1 with npm 10.9.2, while this repository intentionally requires Node.js 24.21.0 and npm 11.19.0. `.npmrc` enables `engine-strict`, so `npm install` is expected to stop before installing dependencies on the wrong runtime.

Because dependency installation stopped, `node_modules/.bin/biome` and `node_modules/.bin/next` did not exist. The later `biome` and `next` "not recognized" messages were therefore consequences of the failed installation, not independent missing source files.

The older lint output also came from an older repository state that still used ESLint and contained explicit `any` types and effect patterns rejected by the current React lint rules. The current source tree uses Biome and contains no explicit `any` in application TypeScript.

## Repository fixes

- Windows doctor now invokes `npm.cmd`, so npm is detected correctly from `npm run doctor` on Windows.
- `@types/react` and `@types/react-dom` are aligned to React 19.3.0 at 19.3.0.
- Type checking now runs `next typegen` before project static checks and `tsc`.
- Generated `next-env.d.ts` is no longer tracked; Next.js regenerates it during `next typegen`, `next dev`, or `next build`.
- Frontend static verification no longer requires `next-env.d.ts` to already exist.
- The release verifier also uses `npm.cmd` on Windows.
- The project remains intentionally pinned to the Node 24.21.0 / npm 11.19.0 baseline.

## Verification available in the repository environment

- Source JavaScript/MJS syntax checks: PASS.
- Data truth verification: PASS.
- Analytical truth verification: PASS.
- Python test suite: PASS (6 tests).
- Git diff check: PASS.

The exact Next.js install/build still must be run after installing the required Node 24.21.0 runtime because this environment cannot access the npm registry.
