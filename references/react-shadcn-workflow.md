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

Prefer the bundled template at `assets/templates/vite-react-shadcn/` for new demos or fresh apps.

The bundled template is the fastest default path. It pins React, Vite, TypeScript, Tailwind 3, PostCSS, shadcn-compatible utilities, and lucide versions; includes `package-lock.json`; uses `moduleResolution: "Bundler"`; includes `src/vite-env.d.ts`; and runs Vite with `--host 0.0.0.0`.

For a fresh demo:

1. Copy the template directory.
2. Edit project files and source code in one pass.
3. Run `npm ci --prefer-offline --no-audit --fund=false`.
4. Run `npm run build` or `npm run typecheck`.
5. Start `npm run dev -- --port <free-port>` and open `http://127.0.0.1:<port>`.
6. In browser automation, prefer `load` or `domcontentloaded` waits; avoid relying on `networkidle`.

Only run `npm install` when no lockfile exists or the project is intentionally changing dependencies.

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
- If neither exists and this is a fresh demo, use the bundled template or the official shadcn Vite flow.
- Do not run multiple shadcn initializations in the same project.
- Do not overwrite existing `tailwind.config`, `index.css`, `components.json`, or `utils.ts` without reading them first.
- Keep shadcn components in `src/components/ui/` unless the project already uses another path.
- Do not change template dependencies to `latest`; keep the lockfile and pinned Tailwind 3 stack unless the user explicitly asks for a dependency upgrade.

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
