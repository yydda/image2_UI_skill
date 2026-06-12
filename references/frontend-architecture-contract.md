# Frontend Architecture Contract

All new Moni UI React deliverables use one fixed engineering architecture. Visual style can change through tokens and themes; the project structure and component contracts stay stable.

The preferred source of this architecture is `moni-ui-foundation`. The bundled `assets/templates/vite-react-shadcn/` template is an offline fallback and seed copy, not the long-term source of truth once the foundation repository is available.

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
    font-faces.css
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
    fonts/
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
- `src/theme/font-faces.css` is the only default place for project-level `@font-face` declarations.
- `src/theme/themes/*.css` may only override token values.
- Tailwind must map to CSS variables where possible.
- Do not scatter hardcoded one-off colors, font stacks, or spacing scales when a token exists.

## Fidelity Rules

- Absolute positioning for screenshot-exact work must be contained inside `FidelityCanvas`.
- Elements measured by fidelity scripts must have stable `data-fidelity-id` attributes.
- Generated assets go in `src/assets/generated/`.
- User-provided reference/crops go in `src/assets/original/`.
- Repaired crops go in `src/assets/repaired/`.
- Downloaded, licensed, or open-source font files go in `src/assets/fonts/` and must be referenced from `src/theme/font-faces.css`.

## Box Model Fidelity

High-fidelity work must still be engineered as CSS boxes, not as a static screenshot:

- major regions map to owner components
- components use grid/flex/block, padding, margin, gap, border, radius, shadow, and stable asset slots
- `FidelityCanvas` is reserved for screenshot-exact overlays and measurement helpers
- responsive behavior is added after the desktop/reference box model is stable
- visual fixes should adjust tokens and box model values before arbitrary transforms or one-off offsets

## Validation

Every new project must pass:

```powershell
npm run typecheck
npm run build
npm run architecture:check
npm run deps:ensure
```

For high-fidelity work, also run the Moni fidelity scripts from the skill root.

After a new demo or sizable page build, generate `tmp/fidelity/reuse-review.md` and promote only reviewed, generic candidates back to `moni-ui-foundation`.
