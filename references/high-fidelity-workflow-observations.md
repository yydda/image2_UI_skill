# High Fidelity Workflow Observations

Date: 2026-06-11

Observed thread: `codex://threads/019eb6e1-dbb5-7ab0-bed9-c6b745fe6cc7`

Latest observed thread: `codex://threads/019ebaff-0e4f-7912-bd6a-7181cc835ce4`

Reference task:

```text
Use $moni-ui-skill，参考这张设计稿做 1:1 高保真 React 页面。
切图前先跑参考图预检；如果原图含批注、水印、浏览器滚动条、悬浮控件或贴纸，先要求干净图或生成 tmp/fidelity/clean-reference.png。
严格按截图裁切/修复素材，exact 资产不要直接生图，完成后跑素材评分和页面 diff。
```

## Current Run Findings

The run improved over the earlier failed output, but it is still not behaving like a careful senior frontend engineer. It starts with good intentions, then moves too quickly into asset cropping and page coding without a hard intermediate plan.

Observed facts:

- The agent did not produce a required page decomposition blueprint before implementation.
- It did not create a structural layout manifest describing page regions, card bounds, text layers, image layers, z-index, repeated components, and interaction targets.
- It created an asset manifest manually, but the asset set was incomplete and biased toward obvious images. Small icons, line details, separators, badges, and decorative strokes were not systematically classified.
- The first asset manifest used `upscale` and 2x target pixels for many crops, but later the manifest was edited back to `repairStrategy: ["none"]` and `targetPixels` equal to the slot size to reduce diff artifacts. This is a useful tactical choice for exact screenshot crops, but it lowered the original asset quality gate without an explicit gate decision.
- `score-asset.mjs` passed because it only checked dimensions/alpha/strategy constraints, not whether exact assets retained 2x export policy or whether a changed strategy was justified.
- The page-level loose diff passed at `threshold=0.12 / maxDiffRatio=0.12` with about `7.56%` diff, but the stricter run failed at about `8.10%` diff against `maxDiffRatio=0.05`.
- The final delivered screenshot passed only the loose gate and reported `diffRatio: 0.086774`. The default strict `5%` gate still failed.
- The final answer still described the output as completed high-fidelity work even though strict 1:1 fidelity was not achieved. This needs a delivery-language gate: if strict mode fails, final wording must say `未达 1:1` and list the remaining blocking regions.
- The main visual drift is in typography, font weight, text metrics, right timeline icons/spacing, bottom trust bar, card spacing, and subtle line/border/background treatment.
- The implementation uses a fixed `1448x1086` canvas, which helps exact positioning, but a small fractional scale caused the whole page to blur in the browser. The workflow needs a no-fractional-scale rule for exact viewport captures.
- Browser automation had transient tab/session errors. The workflow should use a stable Playwright script in the generated project instead of ad hoc browser REPL calls when fidelity is required.
- The run validated interactions, but interaction validation happened late and was not tied to a declared interaction map.
- The run took about 18.6 minutes. Some time went to environment setup and brittle browser control retries; this supports adding a deterministic capture script and reusing the installed skill tooling instead of copying/debugging ad hoc flow each time.

## 2026-06-12 Regression Findings

The later test thread used more of the Moni workflow, but still missed strict 1:1 because the gates were too permissive.

Observed project: `C:\Users\85013\Documents\MyCode\demo\confirm-order-page`

Evidence from the run:

- Reference image: `tmp/fidelity/clean-reference.png`.
- Final screenshot: `tmp/fidelity/capture-3/page.png`.
- Page diff: about `8.03%`, which fails the strict `5%` page gate.
- Worst region diffs included breadcrumb `24.75%`, page-title `19.99%`, payment-methods `11.40%`, payment-bar `11.21%`, notice-banner `11.15%`, order-card `10.62%`, status-panel `9.69%`, and bottom-trust-bar `8.66%`.
- The run did use foundation scaffold, preflight, manifests, crop assets, asset contact sheet, theme calibration, React implementation, architecture/type/build, Playwright screenshot/diff/DOM audit, repair queue, fidelity loop, interaction smoke, and mobile smoke.
- The run did not close the asset repair loop: all eight extracted assets were still effectively `needs-repair`/not accepted, but the implementation consumed them anyway.
- Extracted exact assets were mostly 1x RGB without alpha, for example payment/logo/illustration crops. This is acceptable only with an explicit `source-1x-accepted` downgrade and evidence, not as a default.
- Theme calibration sampled asset colors and selected a blue brand color from a payment icon. Theme sampling must exclude crop boxes from `assets.manifest.json`.
- Font handling did not self-host a closer font. DOM audit showed overflow and width drift in breadcrumb, page title/subtitle, card titles, price, status title, and payment agreement text.
- `diff diagnosis` was effectively skipped in the loop state, so the repair queue was not driven by root-cause categories.

Root causes:

- Asset contact sheet and asset score were reports, not blocking gates.
- `validate-fidelity-plan.mjs` did not enforce accepted asset status before React integration.
- `score-asset.mjs` allowed exact assets below 2x without a formal downgrade policy.
- `calibrate-theme.mjs` did not exclude asset crop areas, so isolated payment/icon colors polluted semantic tokens.
- The loop default stopped too early and did not combine diagnosis + queue into one prioritized focus list.
- Text overflow in critical typography targets was treated like generic layout drift instead of font/token calibration.

Implemented guardrails after this run:

- Contact sheet now supports `--fail-on-review` and rejects unaccepted exact assets, missing alpha, low-density exact outputs, and missing `backgroundColor` for background-matched assets.
- Asset scoring now rejects exact assets below 2x unless `densityPolicy: "source-1x-accepted"` and `downgradeReason` are present.
- Plan validation can enforce asset acceptance with `--enforce-asset-acceptance`.
- Theme calibration accepts `--assets assets.manifest.json` and excludes crop boxes from palette sampling.
- Repair queue accepts `--diagnosis-report` and includes blocked asset statuses.
- Fidelity loop defaults to six iterations and combines diagnosis and queue focus items.
- Element diagnosis treats overflow in title, price, agreement, breadcrumb, status, notice, and CTA targets as typography calibration work.

## Diagnosis

The problem is not only prompt wording. The skill needs a stricter workflow contract.

The current instructions say to analyze, create an asset manifest, repair assets, score, implement, screenshot, and diff. But they do not force a signed-off or machine-checkable intermediate representation before code starts.

For high-fidelity work, the agent should stop treating "asset manifest" as the plan. A proper plan has three separate layers:

- Page blueprint: canvas size, major regions, nested boxes, text layers, repeated components, z-index, interactive targets.
- Asset dependency graph: every non-text visual that is not safely expressible in code, including small custom icons, illustrations, background plates, line art, and exact brand marks.
- Verification contract: per-region diff thresholds, asset gates, font assumptions, and explicit allowed deviations.

Without these layers, the agent falls into a familiar failure mode: it implements a visually plausible page, then uses pixel diff as a late-stage feedback signal. That is useful, but too late.

## External References

These projects suggest useful patterns:

- Screenshot-to-code treats generation as a pipeline with parameter extraction, prompt creation, model selection, multiple variants, and post-processing rather than a single prompt-to-code jump. It supports React/Tailwind among other stacks. Source: https://github.com/abi/screenshot-to-code
- FigmaToCode uses an intermediate representation approach: Figma nodes are converted to JSON, then to custom virtual `AltNodes`, then layout is optimized before code generation. This is the strongest workflow idea to adopt. Source: https://github.com/bernaferrari/FigmaToCode
- UIED detects and classifies GUI text and graphic elements from screenshots, then exports JSON for future use. This supports adding a pre-code UI parsing stage. Source: https://github.com/MulongXie/UIED
- OmniParser parses UI screenshots into structured elements to improve grounding of model actions. Even if we do not install the model by default, the concept supports requiring structured screen parsing before implementation. Source: https://github.com/microsoft/omniparser
- Figmagic emphasizes design tokens, graphics export, and token-driven React component generation from Figma documents. This reinforces separating tokens/assets/components instead of hard-coding visual guesses. Source: https://github.com/mikaelvesavuori/figmagic
- Figma plugin `exportAsync` supports exporting nodes as PNG/SVG/REST JSON with explicit scale settings. If a user provides Figma later, this should replace screenshot crop guessing. Source: https://developers.figma.com/docs/plugins/api/properties/nodes-exportasync/
- Playwright visual comparisons provide a mature model for repeatable screenshot baselines. Source: https://playwright.dev/docs/test-snapshots
- Pixelmatch is appropriate as a low-level image diff engine, but it should be combined with region-level budgets, not only whole-page ratios. Source: https://github.com/mapbox/pixelmatch

## Workflow Changes To Implement

### 1. Add a mandatory pre-code blueprint gate

Before writing React code, high-fidelity mode must write:

```text
tmp/fidelity/page-blueprint.json
tmp/fidelity/implementation-plan.md
```

The blueprint should contain:

- `canvas`: width, height, background colors, DPR, expected viewport.
- `regions`: header, breadcrumb, hero/title area, left content card, warning card, payment section, payment footer, right status panel, bottom trust bar.
- `boxes`: x, y, width, height, role, renderStrategy, zIndex.
- `textLayers`: content, x, y, font family assumption, size, weight, line-height, color, max width.
- `assetSlots`: x, y, width, height, sourceStrategy, repairStrategy, qualityGate.
- `interactions`: target selector/name, expected state change.
- `knownRisks`: fonts, exact icons, low-contrast line art, anti-aliasing differences.

React implementation may start only after this file exists.

### 2. Split layout planning from asset planning

Do not let `assets.manifest.json` carry the whole design plan.

Add:

```text
tmp/fidelity/layout-manifest.json
assets.manifest.json
tmp/fidelity/interaction-map.json
```

The page implementation must cite all three.

### 3. Add asset manifest downgrade protection

If an asset starts as `upscale`, `rembg-alpha`, `vectorize-svg`, or target pixels >= 2x, the agent must not silently change it to `none` or 1x.

When a downgrade is intentional, write:

```json
{
  "id": "brand-lockup",
  "downgradeReason": "Exact crop displayed at original CSS pixels produced lower visual diff than interpolated 2x asset.",
  "acceptedBy": "local-fidelity-run",
  "evidence": "round-1-strict vs round-2 diff"
}
```

The scoring script should warn or fail when exact assets are downgraded without this field.

### 4. Add region-level diff

Whole-page diff hides the real problem. Add named crop regions:

- header
- title area
- main order card
- notice card
- payment methods
- amount/payment bar
- right timeline
- right note card
- bottom trust bar

Each region should output:

- diff ratio
- diff pixels
- threshold
- pass/fail
- diff image path

The final report should sort failures by region severity.

### 5. Add font and text metric audit

For high-fidelity UI, typography must be first-class.

Add a text audit checklist:

- measured font sizes for H1, H2, body, small text, price, button.
- approximate font family and fallback.
- line-height and font-weight.
- text bounding boxes from implementation compared to reference region.

This should happen before broad CSS tweaking.

### 6. Add stable screenshot runner

Generate a project-local script:

```text
scripts/capture-fidelity.mjs
```

It should:

- start or reuse the local dev server.
- open Playwright at the exact canvas size.
- force `deviceScaleFactor: 1`.
- disable fractional page scale for exact viewport.
- capture deterministic screenshots.
- run `compare-fidelity.mjs`.

This avoids fragile ad hoc browser REPL state.

### 7. Add "senior engineer mode" execution order

High-fidelity implementation order should be:

1. Preserve original reference image.
2. Measure canvas and major regions.
3. Produce page blueprint.
4. Produce layout manifest.
5. Produce complete asset manifest.
6. Review asset plan for exact vs code vs generated assets.
7. Batch extract all assets.
8. Batch repair all assets.
9. Batch score all assets.
10. Implement React using blueprint and manifests.
11. Capture screenshot with stable runner.
12. Run page diff and region diff.
13. Fix highest-severity region first.
14. Repeat until strict gate passes or record explicit remaining deviations.

### 8. Add final wording and stop-condition gates

If the user asks for `1:1` or pixel-level fidelity, final delivery must follow these rules:

- If strict whole-page or critical-region gates fail, do not say "1:1 completed" or "high-fidelity completed" without qualification.
- Use explicit status: `strict gate passed`, `loose gate passed only`, or `未达 1:1`.
- List the top failing regions and the next fixes.
- If the agent stops due to time, environment, or acceptable approximation, record the stop reason as a constraint, not as success.

## Prompt Changes

The skill prompt should be more forceful:

```text
高保真模式下，禁止直接开始写 React 页面。
你必须先产出 page-blueprint.json、layout-manifest.json、assets.manifest.json、element-manifest.json、icon-inventory.json 和 interaction-map.json。
如果这些文件不存在，不允许进入实现阶段。
```

Add:

```text
不要只列明显插画。需要把所有视觉层分类：
文本、可代码渲染形状、标准图标、自定义图标、精确品牌资产、插画、背景线稿、装饰线、阴影/渐变/纹理。
```

Add:

```text
如果修改 asset manifest 降低质量门槛，例如从 2x 改成 1x、从 upscale 改成 none，必须写 downgradeReason，并用前后 diff 证明这是更好的选择。
```

## Tooling Backlog

- `scripts/analyze-reference-image.mjs`: sample canvas size, dominant colors, maybe optional OCR/CV hooks.
- `scripts/create-layout-manifest.mjs`: validate manually entered or model-generated regions.
- `scripts/score-layout.mjs`: compare bounding boxes against blueprint.
- `scripts/compare-region-fidelity.mjs`: region-level pixelmatch reports.
- `scripts/audit-fonts.mjs`: inspect rendered DOM text metrics and compare to declared text layer boxes.
- `scripts/capture-fidelity.mjs`: deterministic Playwright capture.
- `scripts/validate-fidelity-plan.mjs`: fail if implementation starts without required manifests.

## Acceptance Targets

For 1:1 mode, suggested gates:

- Whole-page strict diff: target <= 5%.
- Critical regions: header, main order card, payment bar, right timeline <= 4%.
- Exact assets: no `image_gen-fallback`; no downgrade without reason.
- Text audit: no obvious font-weight/line-height mismatch on H1, price, CTA, right panel titles.
- No fractional scale in reference-size screenshots.
- Final report must include all remaining deviations by region.
