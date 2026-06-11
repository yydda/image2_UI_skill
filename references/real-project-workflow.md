# Real Project Workflow

Use this reference when Moni UI is applied to an existing codebase rather than a fresh demo.

## Discovery

Before editing, inspect:

- `package.json` scripts and dependencies
- routing and page conventions
- component directories and naming
- styling system, Tailwind config, shadcn config, theme tokens
- asset directories and import style
- state management, data fetching, auth, permissions, analytics
- existing tests, lint, typecheck, build, and preview commands

## Change Strategy

- Preserve public component APIs: props, events, refs, slots, data contracts, route params.
- Do not migrate frameworks unless the user explicitly asks.
- Prefer existing design-system components and tokens over new local one-off components.
- Add new shadcn components only when the project already uses shadcn or the user asked for shadcn.
- Keep business text, form labels, data, prices, and table content as code-rendered UI.
- Use `image_gen` only for missing bitmap visuals such as hero art, product scenes, textures, cutouts, or illustrations.
- Keep user-provided logos, product screenshots, brand assets, and photos as original assets unless the user requests variants.

## Implementation

- Place page-level work where the project expects pages or routes.
- Place reusable UI in the project’s existing component hierarchy.
- Add generated assets under the existing generated-asset convention, preferably `src/assets/generated/`.
- Import assets with the local project’s existing style.
- Add loading, empty, error, disabled, selected, and hover/focus states when the real flow needs them.
- Wire the page into routing/navigation if the user asked for a real page, not just an isolated preview.

## Verification

Run the best available commands, usually in this order:

1. install dependencies if needed and allowed
2. lint
3. typecheck
4. unit/component tests
5. build
6. dev server preview
7. browser interaction and screenshot checks

If a command cannot run, report the exact blocker and the remaining risk. Do not claim production readiness when only static files were edited.

## Final Report

For real-project work, report:

- changed files
- reused project conventions
- generated assets and import paths
- route/component integration points
- validation commands and results
- screenshots or preview URL
- any API, data, auth, or design-system assumptions
