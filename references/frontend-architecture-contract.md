# Frontend Architecture Contract

All new Moni UI React deliverables use one fixed engineering architecture. Visual style can change through tokens and themes; the project structure and component contracts stay stable.

## Fixed Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui component conventions
- `@/*` TypeScript/Vite alias to `src/*`
- Local assets imported from TypeScript, not hardcoded absolute paths

## Required Structure

```text
src/
  app/
    AppShell.tsx
    routes.tsx
  pages/
  components/
    ui/
    primitives/
    layout/
    fidelity/
  theme/
    tokens.css
    themes/
      default.css
      warm-finance.css
      mobile-ios.css
    typography.css
  assets/
    generated/
    original/
    repaired/
  data/
  lib/
    utils.ts
    asset-registry.ts
  types/
    fidelity.ts
    page.ts
```

## Component Boundaries

- `src/components/ui/` contains shadcn base components only.
- `src/components/primitives/` contains shared UI primitives such as price text, status dots, icon frames, badges, action groups, payment options, status timelines, agreement bars, notice banners, and info summary cards.
- `src/components/layout/` contains app/page layout wrappers.
- `src/components/fidelity/` contains high-fidelity helpers such as `FidelityCanvas`, `AssetSlot`, and `MeasuredText`.
- Page-specific code lives in `src/pages/`.
- Shared data lives in `src/data/`.

## Tokens And Themes

- `src/theme/tokens.css` defines semantic variables for color, typography, spacing, radii, shadows, borders, and z-index.
- `src/theme/themes/*.css` may only override token values.
- Tailwind must map to CSS variables where possible.
- Do not scatter hardcoded one-off colors, font stacks, or spacing scales when a token exists.

## Fidelity Rules

- Absolute positioning for screenshot-exact work must be contained inside `FidelityCanvas`.
- Elements measured by fidelity scripts must have stable `data-fidelity-id` attributes.
- Generated assets go in `src/assets/generated/`.
- User-provided reference/crops go in `src/assets/original/`.
- Repaired crops go in `src/assets/repaired/`.

## Validation

Every new project must pass:

```powershell
npm run typecheck
npm run build
npm run architecture:check
npm run deps:ensure
```

For high-fidelity work, also run the Moni fidelity scripts from the skill root.
