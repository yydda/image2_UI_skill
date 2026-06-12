# High-Fidelity Iteration Tools

Use this reference when a screenshot-to-code task needs 1:1 or near-1:1 fidelity. These tools turn visual QA into a repeatable loop instead of relying on visual intuition alone.

## Asset Contact Sheet

Run before implementing the React page:

```bash
node scripts/build-asset-contact-sheet.mjs --manifest assets.manifest.json --source tmp/fidelity/clean-reference.png --fail-on-review
```

The output `tmp/fidelity/asset-contact-sheet.html` shows every planned asset with crop box, slot size, target pixels, source strategy, repair strategy, transparency requirement, quality gate, and preview.

Rules:

- Do not start React implementation until every exact asset has an explicit source strategy and appears in the contact sheet.
- Do not start React implementation while any exact asset is `needs-repair`, `needs-review`, `needs-regenerate`, `rejected`, or `failed`.
- Exact assets must export at least 2x their slot size unless `densityPolicy: "source-1x-accepted"` and `downgradeReason` document why the original 1x crop gives a better strict diff.
- Assets that require transparency must show a real alpha channel; white or cream matte backgrounds are failures unless the asset is explicitly `backgroundMatched` with `backgroundColor`.
- Exact logo, payment icon, brand mark, line-art, and custom UI icon assets must not use `image_gen-fallback`.
- If the sheet shows missing previews, wrong crop boxes, transparent/background conflicts, or missing target pixels, fix the manifest before writing UI code.

After repair, score the assets with a hard reject gate:

```bash
node scripts/repair-asset.mjs --manifest assets.manifest.json
node scripts/score-asset.mjs --manifest assets.manifest.json --fail-on-reject
node scripts/validate-fidelity-plan.mjs --blueprint tmp/fidelity/page-blueprint.json --layout tmp/fidelity/layout-manifest.json --assets assets.manifest.json --elements tmp/fidelity/element-manifest.json --icons tmp/fidelity/icon-inventory.json --interactions tmp/fidelity/interaction-map.json --mode strict --enforce-asset-acceptance --fail-on-error
```

Only mark an asset `accepted` in `assets.manifest.json` after the repaired/vector output passes scoring and visual review.

## Diff Diagnosis

Run after page diff, region diff, DOM audit, or asset scoring:

```bash
node scripts/diagnose-fidelity-diff.mjs \
  --page-report tmp/fidelity/fidelity-report.json \
  --region-report tmp/fidelity/region-diff/region-fidelity-report.json \
  --element-report tmp/fidelity/element-audit/element-audit-report.json \
  --asset-report src/assets/original/repaired/asset-score-report.json
```

The output `tmp/fidelity/diff-diagnosis.json` classifies failures into layout, spacing, font, token, asset, and overflow categories. Fix the highest-priority findings first.

## Theme Calibration

Run before building a new visual theme or when colors/typography feel off:

```bash
node scripts/calibrate-theme.mjs \
  --reference tmp/fidelity/clean-reference.png \
  --elements tmp/fidelity/element-manifest.json \
  --assets assets.manifest.json
```

The output `tmp/fidelity/theme-calibration.css` is a starting point for a theme preset. Passing `--assets` excludes crop areas for logos, payment icons, illustrations, and line art so accent colors do not get polluted by isolated asset colors. Review the result as a designer; do not blindly paste if the sampled reference contains watermarks, browser chrome, or annotations.

## Repair Loop

Run after diagnosis and repair queue generation:

```bash
node scripts/build-repair-queue.mjs \
  --page-report tmp/fidelity/fidelity-report.json \
  --region-report tmp/fidelity/region-diff/region-fidelity-report.json \
  --element-report tmp/fidelity/element-audit/element-audit-report.json \
  --asset-report src/assets/original/repaired/asset-score-report.json \
  --diagnosis-report tmp/fidelity/diff-diagnosis.json

node scripts/run-fidelity-loop.mjs \
  --queue tmp/fidelity/repair-queue.json \
  --diagnosis tmp/fidelity/diff-diagnosis.json \
  --iteration 1 \
  --max-iterations 6
```

Fix only the loop focus items, capture again, rerun the gates, then continue to the next iteration. If the loop reaches `maxIterations` with failures, report `loose gate passed only` or `未达 1:1`.

## Component Library First

Before creating new one-off JSX, check the template primitives:

- `PaymentOption`
- `StatusTimeline`
- `AgreementBar`
- `NoticeBanner`
- `InfoSummaryCard`
- `PriceText`
- `StatusDot`
- `IconFrame`
- `PhoneFrame`
- `FidelityCanvas`
- `AssetSlot`
- `MeasuredText`

Use these components for common payment, order, status, notice, amount, mobile preview, and fidelity-canvas patterns. Add a new primitive only when a pattern appears more than once or clearly belongs in the shared UI system.

## Speed Rules

- Use `npm run deps:ensure` for fresh template projects; it skips reinstall when `package.json` and `package-lock.json` are unchanged.
- Do not run dependency installation after every CSS or component edit.
- Reuse template lockfiles and local npm cache with `npm ci --prefer-offline --no-audit --fund=false`.
- Use region diff and DOM audit on failed regions before rerunning broad page-level work.
- Do not copy `node_modules`, `dist`, or `tmp` into generated projects or installed skills.
