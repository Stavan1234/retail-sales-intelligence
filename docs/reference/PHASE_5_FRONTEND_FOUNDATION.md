# Phase 5 — Frontend Foundation

## Status

Implemented offline-safe frontend shell and design-system scaffolding.

## Foundation

- Next.js App Router shell with five primary product routes.
- `components.json` configured for current shadcn/ui `base-nova`, Tailwind v4, CSS variables, Lucide.
- Semantic OKLCH design tokens for light/dark themes.
- Responsive desktop sidebar + mobile navigation.
- URL-backed global filters: year, region, category, segment, from, to.
- Reusable `Card`, `Badge`, `Button`, `Input`, `Separator`, `Skeleton` primitives following shadcn conventions.
- No fabricated analytics values. KPI surfaces display placeholders until Phase 6 connects the API.
- Google-hosted font dependency removed; system font stack keeps local/offline builds safer.
- Reduced-motion support and keyboard focus states included.

## Routes

- `/command-center`
- `/data-preparation`
- `/explore`
- `/statistics`
- `/anomalies`

Root `/` redirects to `/command-center`.

## Current dependency targets researched on 2026-10-04

- `@base-ui/react` 1.8.0
- `@tanstack/react-table` 9.2.4
- `echarts` 6.1.0
- `lucide-react` 1.51.0
- `motion` current stable line at implementation/install time
- `shadcn` current CLI line

## Registry limitation

The execution environment could not resolve registry.npmjs.org (DNS EAI_AGAIN), so Phase 5 does **not** claim a fresh dependency installation or a Node build against these packages. The existing lockfile was intentionally left untouched rather than manually fabricating dependency-resolution data.

The package manifest records the intended targets. In an online Node 24 environment, run `npm install` to refresh `package-lock.json` and then run the normal `npm run check` / `npm run build` verification before Phase 6.

## Research basis

Official shadcn documentation now defaults new projects to Base UI and supports `base-nova`, Tailwind v4 and React 19. Base UI remains accessible and headless. TanStack Table v9 is the current table architecture. Motion uses `motion/react` for React integrations.
