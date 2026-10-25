# Phase 1 — Toolchain Baseline

Status: **COMPLETE**

## Locked runtime/toolchain

| Concern | Project decision |
|---|---|
| Node.js | 24.21.0 LTS |
| npm | 11.19.0 |
| Next.js | 16.3.8 (Active LTS / security-patched baseline) |
| React | 19.3.0 |
| React DOM | 19.3.0 |
| TypeScript | 6.0.3 |
| Tailwind CSS | 4.3.x line |
| ESLint | 9.x line |

## Why these versions

- Node 24 is the chosen LTS runtime for the project. Node 24.21.0 is an LTS release.
- Next.js remains pinned to 16.3.8 rather than moving to canary releases. The project should prefer stable Active LTS builds.
- React 19.3.0 is the current stable React release.
- TypeScript 6.0.3 is used deliberately instead of TypeScript 7.x. TypeScript 6 is the current compatibility-oriented transition release, while TypeScript 7 is the native-compiler line. We will not introduce the native compiler until the framework/toolchain is explicitly validated for it.
- Node type declarations stay on the Node 24 major so the type surface does not describe APIs from a newer Node runtime than the application actually targets.

## Project scripts

```text
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run check
```

`typecheck` runs Next route/type generation before `tsc` so generated Next types are present for the compiler.

## Configuration decisions

- TypeScript remains strict.
- JavaScript files are not part of the TypeScript project (`allowJs: false`).
- ES2025 is used for TypeScript target/lib because this is a modern Next application with `noEmit: true`.
- npm remains the package manager; there is no unnecessary package-manager migration.
- `.nvmrc` and `.node-version` pin Node 24.21.0 as the development target.

## Important environment limitation

The working environment used for this phase has Node 22 available and does not have the complete external npm package cache required to regenerate the lockfile from the network. Therefore the React/TypeScript/runtime versions are being recorded and locked from verified release metadata, but a final clean-install/build under Node 24 will be performed in the user's development environment before the project is considered fully runtime-validated.

This is intentional: no claim of a successful Node 24 build is made from this environment.

## References checked during Phase 1

- Node.js releases / LTS status: https://nodejs.org/en/about/previous-releases
- Node.js release feed: https://nodejs.org/en/blog/release
- Next.js support policy: https://nextjs.org/support-policy
- Next.js September 2026 security release: https://nextjs.org/blog
- React 19.3 release: https://react.dev/blog/2026/09/09/react-19-3
- React versions: https://react.dev/versions
- TypeScript 6.0 release notes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
- TypeScript release list: https://github.com/microsoft/TypeScript/releases
