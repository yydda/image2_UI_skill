# Codex Capability Routing

Use this contract when `moni-ui-skill` needs Codex capabilities during screenshot-to-code work. Moni UI is an orchestration skill: it should reuse stronger built-in Codex skills/tools instead of rebuilding them.

## Routing Priority

| Need | Preferred capability | Moni responsibility |
| --- | --- | --- |
| Generate or edit bitmap assets | built-in `imagegen` skill / `image_gen` tool | Plan asset slots, write per-asset prompts, copy accepted outputs into project assets, score integration. |
| Browser preview, screenshots, DOM checks, clicks | Codex Browser or Playwright-backed scripts | Define target URL, viewport, selectors, reports, acceptance gates. |
| General screenshot-to-code inspiration | Product Design image-to-code skills when available | Keep output inside the Moni frontend architecture and run Moni validation. |
| Shared frontend base | `moni-ui-foundation` via `sync-foundation.mjs` | Pull the latest template, tokens, primitives, fidelity helpers, and fall back to bundled template only when unavailable. |
| Deterministic high-fidelity checks | Local Moni scripts | Preflight, contact sheet, theme calibration, crop, repair, score, diff diagnosis, DOM audit, repair queue, fidelity loop, and `check-frontend-architecture.mjs`. |
| Project-specific coding conventions | Repo files and `AGENTS.md` if present | Preserve existing APIs, routes, tokens, and validation commands. |

## Rules

- Do not implement alternate image generation clients, browser controllers, screenshot tools, or external API fallbacks inside Moni.
- Built-in Codex capabilities are helpers, not owners of the final deliverable. The final project must still pass the Moni architecture and fidelity gates.
- If a built-in capability proposes code that violates the fixed Moni architecture, adapt the code into the architecture instead of changing the architecture.
- If a capability is unavailable, say which capability is missing and continue with deterministic local scripts only where they cover the same need.
- For screenshot-only work, do not ask for Figma or design source files. Use clean screenshots plus the Moni preflight, manifest, and browser QA loop.
- For new demos, sync `moni-ui-foundation` first. At task end, generate a reuse review and promote only user-approved generic candidates back to foundation.

## Execution Shape

1. Read the screenshot and current project context.
2. Route bitmap work to `image_gen` only when the asset policy allows it.
3. Sync `moni-ui-foundation`; use its unified React template or the existing project architecture.
4. Run `check-frontend-architecture.mjs` for new Moni React projects.
5. Run asset contact sheet and theme calibration before implementation when high fidelity is requested.
6. Run local deterministic reports for anything that affects acceptance.
7. Build `diff-diagnosis.json`, `repair-queue.json`, and `fidelity-loop-state.json` when diff, asset scoring, or DOM audit fails.
8. Use Codex Browser/Playwright for rendered proof.
9. Generate `reuse-review.md` for new demos or sizable page work.
10. Report the generated files, screenshot evidence, reuse review, and any failed gates.
