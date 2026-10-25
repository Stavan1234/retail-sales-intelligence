# Repair Note — Biome Configuration & Windows Doctor

## Problem observed on Windows

The project installed successfully under Node 24.21.0, but `npm run doctor` reported npm as unavailable and `npm run check` stopped while deserializing `biome.json`.

## Root causes

1. Biome 2.5 no longer accepts `files.ignore`. File selection is configured through `files.includes`, with `!` and `!!` negation patterns.
2. Biome 2.5 deprecates `linter.rules.recommended`; the modern form is `linter.rules.preset: "recommended"`.
3. The previous doctor tried to discover npm through a single executable path. On Windows, npm is invoked through `npm.cmd`, and npm scripts also expose npm configuration metadata in the environment.

## Fixes

- Migrated the Biome configuration to the 2.5 schema.
- Added explicit formatter/linter include scopes so documentation, datasets and generated output are not needlessly linted.
- Made `doctor.mjs` detect npm from `npm_config_user_agent`, `npm_execpath`, the Node installation directory, and `npm.cmd` as fallbacks.
- Made the doctor detect future regressions in the Biome configuration.
- Made the doctor require a lockfile when `node_modules` is already present.
- Updated the README so a valid generated `package-lock.json` is retained instead of deleted during normal development.
- Updated the transaction table to use TanStack Table v9's typed `createColumnHelper` API.

## Windows verification

After applying this repair on the user's Node 24.21.0 environment, run:

```powershell
node -v
npm -v
npm run doctor
npm run check
npm run build
```

Expected runtime:

```text
Node v24.21.0
npm 11.19.0
```
