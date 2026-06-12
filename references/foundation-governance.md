# Moni UI Foundation Governance

`moni-ui-foundation` is the shared frontend foundation for Moni UI work. It is the reusable engineering base; `moni-ui-skill` is the workflow brain that pulls, applies, validates, and reviews it.

## Repository Split

- `moni-ui-skill`: skill instructions, routing rules, deterministic scripts, QA workflow, and task orchestration.
- `moni-ui-foundation`: reusable frontend architecture, Vite + React + TypeScript + shadcn template, tokens, primitives, fidelity components, examples, and stable validation scripts.

## Start Of Task

1. Run `node scripts/sync-foundation.mjs` unless the user explicitly requests offline/bundled mode.
2. For new demos, run `node scripts/scaffold-react-project.mjs --target <project>`. This prefers the latest foundation template and falls back to the bundled template only when foundation is unavailable.
3. Keep project-specific work in `src/pages`, `src/data`, and `src/assets`.
4. Prefer foundation primitives, layout, fidelity helpers, and tokens before creating one-off components.
5. Run `npm run architecture:check`, typecheck/build, screenshot QA, diff, and DOM audit as required by the task.

## End Of Task

1. Run `node scripts/generate-reuse-review.mjs --project <project>` for any finished new demo or sizable page implementation.
2. Read `tmp/fidelity/reuse-review.md` and separate reusable foundation candidates from one-off page code.
3. Promote only after review. Use `node scripts/promote-to-foundation.mjs --project <project> --paths <comma-separated-relative-paths> --apply` when the user explicitly approves promotion.
4. Commit foundation changes in `moni-ui-foundation` as a separate focused PR or direct commit, depending on the user's GitHub preference.

## Promotion Criteria

Promote a component, token, theme, or script only when it:

- solves a repeated UI or workflow problem
- has a generic API and no page-specific business copy
- uses semantic tokens instead of one-off colors, spacing, or shadows
- contains no customer logo, private asset, local absolute path, or generated screenshot
- passes typecheck/build/architecture checks in the foundation template
- includes a small example or can be demonstrated in the existing template

Do not promote:

- one-off pages
- exact customer screenshots or cropped brand assets
- local paths such as `C:\...`, `D:\...`, or `/Users/...`
- generated images that are not licensed or intentionally reusable
- emergency pixel tweaks that only satisfy a single reference

## Failure Behavior

If foundation pull fails, use the bundled template and say so in the final report. Do not block ordinary UI work just because the external foundation repository is temporarily unavailable.

If the foundation worktree is dirty, do not auto-pull or overwrite it. Use the existing local foundation and report that update was skipped because the worktree is dirty.
