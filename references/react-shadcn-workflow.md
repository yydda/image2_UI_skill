# React + shadcn Workflow

Use this reference when creating or updating a React implementation for Moni UI.

## Fresh Vite Project

Default stack:

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- `lucide-react`
- `@/*` alias to `src/*`

Prefer the latest `moni-ui-foundation` template for new demos or fresh apps. The bundled template at `assets/templates/vite-react-shadcn/` is the offline fallback and seed copy.

The foundation template is the fastest default path. It pins React, Vite, TypeScript, Tailwind 3, PostCSS, shadcn-compatible utilities, and lucide versions; includes `package-lock.json`; uses `moduleResolution: "Bundler"`; includes `src/vite-env.d.ts`; includes the fixed Moni architecture, CSS tokens, `src/theme/font-faces.css`, `src/assets/fonts/`, theme presets, primitives, fidelity components, `architecture:check`, `.cmd` Windows wrappers, and `scripts/start-dev-server.mjs` for safe Vite startup.

The architecture contract is mandatory for new demos. Read `references/frontend-architecture-contract.md` before changing the template shape. Style can change through `src/theme/tokens.css`, `src/theme/themes/*.css`, and page implementation; do not move shadcn primitives, asset directories, app shell, or validation scripts for a one-off page.

For a fresh demo:

1. Run `node scripts/sync-foundation.mjs`.
2. Run `node scripts/scaffold-react-project.mjs --target <target>`. Use `--no-foundation` only for offline/bundled fallback.
3. Edit project files and source code in one pass.
4. On Windows, run `cmd /c npm.cmd run deps:ensure`; if that script is unavailable, run `cmd /c npm.cmd ci --prefer-offline --no-audit --fund=false`.
5. Run `cmd /c validate.cmd`, or run `cmd /c npm.cmd run architecture:check`, `cmd /c npm.cmd run typecheck`, and `cmd /c npm.cmd run build`.
6. Start Vite with `node scripts\start-dev-server.mjs --port <free-port>` or `cmd /c dev.cmd --port <free-port>`, then open the printed `http://127.0.0.1:<port>` URL. If Windows/npm swallows stdout on first launch, read the URL from `tmp/dev-server.json`.
7. Do not use `Start-Process npm`, bare `npm run dev`, direct `vite`, direct `tsc`, direct `playwright`, or `node_modules\.bin\*.ps1` paths on Windows; they may trigger the `.ps1` Open With dialog.
8. In browser automation, prefer `load` or `domcontentloaded` waits; avoid relying on `networkidle`.
9. After delivery, run `node scripts/generate-reuse-review.mjs --project <target>` from the skill root and report the reusable candidates.

Only run dependency installation when no lockfile exists or the project is intentionally changing dependencies; on Windows use `cmd /c npm.cmd install --no-audit --fund=false` rather than bare `npm install`.

## Existing Project Checks

Before initializing shadcn or adding components, check:

- Does `package.json` already include React, Vite, Tailwind, shadcn, or a UI kit?
- Is there a `components.json`?
- Is there a `src/lib/utils.ts` with `cn()`?
- Is `@/*` already configured in `vite.config.ts` and `tsconfig*.json`?
- Which package manager is present: `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, or `bun.lockb`?
- Where do UI components live: `src/components/ui`, `components/ui`, or another local convention?
- Does the app use app-level routing, file routes, or manually composed pages?

## shadcn Init Rules

- If shadcn is already configured, add only the missing components.
- If Tailwind exists but shadcn does not, initialize shadcn without replacing project theme conventions.
- If neither exists and this is a fresh Moni demo, sync `moni-ui-foundation` and scaffold from it before considering the bundled fallback or official shadcn Vite flow.
- Do not run multiple shadcn initializations in the same project.
- Do not overwrite existing `tailwind.config`, `index.css`, `components.json`, or `utils.ts` without reading them first.
- Keep shadcn components in `src/components/ui/` unless the project already uses another path.
- Do not change template dependencies to `latest`; keep the lockfile and pinned Tailwind 3 stack unless the user explicitly asks for a dependency upgrade.
- For a fresh Moni project, keep the fixed `src/app`, `src/pages`, `src/components/primitives`, `src/components/layout`, `src/components/fidelity`, `src/theme`, `src/assets/generated`, `src/assets/original`, `src/assets/repaired`, `src/assets/fonts`, `src/lib`, and `src/types` layout.
- Before creating a one-off component, check template primitives such as `PaymentOption`, `StatusTimeline`, `AgreementBar`, `NoticeBanner`, `InfoSummaryCard`, `PriceText`, `StatusDot`, `IconFrame`, `PhoneFrame`, `FidelityCanvas`, `AssetSlot`, and `MeasuredText`.

## Component Selection

Use shadcn components for:

- Button
- Card
- Tabs
- Dialog
- Dropdown Menu
- Input
- Textarea
- Select
- Switch
- Checkbox
- Separator
- Table
- Badge

Do not use shadcn as a substitute for generated images. Photos, textures, hero art, product renders, and complex illustrations still follow the `image_gen` asset workflow.

## Generated Asset Import Pattern

```tsx
import heroMainImage from "@/assets/generated/hero-main-desktop.webp"

export function HeroSection() {
  return (
    <img
      src={heroMainImage}
      alt="Product dashboard preview"
      className="h-full w-full object-cover"
    />
  )
}
```

Avoid absolute filesystem paths, remote URLs as final assets, and assets that exist only under `$CODEX_HOME/generated_images`.
