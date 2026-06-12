# High Fidelity Execution Contract

Use this contract when the user asks for `1:1`, pixel-level, exact, strict, or high-fidelity UI recreation.

## Non-Negotiable Gate

Do not start React implementation until these files exist and pass validation:

```text
tmp/fidelity/page-blueprint.json
tmp/fidelity/layout-manifest.json
assets.manifest.json
tmp/fidelity/element-manifest.json
tmp/fidelity/icon-inventory.json
tmp/fidelity/interaction-map.json
```

Run:

```powershell
node scripts/validate-fidelity-plan.mjs `
  --blueprint tmp/fidelity/page-blueprint.json `
  --layout tmp/fidelity/layout-manifest.json `
  --assets assets.manifest.json `
  --elements tmp/fidelity/element-manifest.json `
  --icons tmp/fidelity/icon-inventory.json `
  --interactions tmp/fidelity/interaction-map.json `
  --mode strict `
  --fail-on-error
```

If this fails, fix the plan before writing page code.

## Reference Preflight

Do not crop assets from an annotated or contaminated screenshot. Before asset extraction, run:

```powershell
node scripts/inspect-reference-image.mjs `
  --source src/assets/original/reference.png `
  --out-dir tmp/fidelity/reference-preflight `
  --fail-on-contamination
```

Treat these as contaminated source signals:

- red annotation arrows, boxes, pointers, or review marks
- diagonal watermark text
- browser or app scrollbar edges
- download, zoom, chat, assistant, or recording overlays
- stickers, avatars, or unrelated floating widgets

If preflight fails, do not continue with `assets.manifest.json` crop boxes against that source. Ask for a clean design export, or first create `tmp/fidelity/clean-reference.png` by cropping to the design canvas and masking/removing non-design overlays. Use that clean file as the `--source` for extraction and diff.

`scripts/extract-reference-assets.mjs` runs the same preflight by default and will stop on contaminated sources. `--allow-contaminated-source` is only for debugging or non-exact assets; never use it for `qualityGate: exact` crops.

## Required Page Blueprint

`page-blueprint.json` describes the reference image as an implementation blueprint:

```json
{
  "fidelityMode": "screenshot-exact",
  "canvas": {
    "width": 1448,
    "height": 1086,
    "deviceScaleFactor": 1,
    "background": "#fffdf8"
  },
  "regions": [
    { "id": "header", "x": 0, "y": 0, "width": 1448, "height": 80, "critical": true },
    { "id": "main-order-card", "x": 34, "y": 235, "width": 940, "height": 340, "critical": true },
    { "id": "right-status-panel", "x": 1006, "y": 135, "width": 408, "height": 810, "critical": true }
  ],
  "textLayers": [],
  "assetSlots": [],
  "interactions": []
}
```

Use `fidelityMode: "screenshot-exact"` when the goal is matching a supplied screenshot at DPR 1. In this mode, original-size crops are allowed when they produce better pixel match than upscaled assets, but the decision must be recorded.

Use `fidelityMode: "production-quality"` when the goal is a production page that should look crisp on retina displays. In this mode, raster assets should usually export at least 2x the displayed slot.

## Required Layout Manifest

`layout-manifest.json` maps design regions to implementation responsibilities:

```json
{
  "regions": [
    {
      "id": "payment-bar",
      "x": 34,
      "y": 857,
      "width": 940,
      "height": 116,
      "renderStrategy": "code",
      "component": "PaymentBar",
      "layoutType": "grid",
      "boxModel": {
        "padding": "0 20px",
        "margin": "0",
        "gap": 18,
        "border": "1px solid var(--payment-border)",
        "radius": 6,
        "shadow": "none"
      },
      "critical": true,
      "maxDiffRatio": 0.04
    }
  ],
  "boxes": [],
  "textLayers": []
}
```

Every major visual region must have one owner component or implementation note. In maintainable 1:1 mode, every region must also record the CSS box model: layout type, padding, margin, gap, border, radius, shadow, and asset slots. Prefer real grid/flex/block layout before using absolute positioning.

Use `FidelityCanvas` for measurement and screenshot-exact overlays only. Do not build the whole page as one static image or a flat list of arbitrary absolute positions when normal CSS boxes can express the design.

Critical regions must use `maxDiffRatio <= 0.06`. If a critical region needs a looser threshold, the correct result is not "pass"; mark the final delivery as `loose gate passed only` or `未达 1:1` and list that region.

## Required Element Manifest

`element-manifest.json` records the element-level implementation contract. It is used after render to detect layout drift, text overflow, element overlap, and font mismatch:

```json
{
  "canvasSelector": ".payment-canvas",
  "elements": [
    {
      "id": "pay-button",
      "type": "button",
      "selector": "[data-fidelity-id='pay-button']",
      "text": "去支付",
      "x": 720,
      "y": 879,
      "width": 233,
      "height": 51,
      "font": {
        "size": 20,
        "weight": 800,
        "lineHeight": 24
      },
      "critical": true,
      "tolerance": 3
    }
  ],
  "overlapGroups": [
    {
      "id": "payment-agreement-vs-button",
      "elements": ["agreement-copy", "pay-button"],
      "allowOverlap": false
    }
  ]
}
```

Include every important button, text layer, icon container, divider, price block, badge, status item, and high-impact decorative slot. Add stable `data-fidelity-id` selectors in React so the rendered DOM can be audited.

## Required Icon Inventory

`icon-inventory.json` records every icon decision:

```json
{
  "icons": [
    {
      "id": "wechat-pay-icon",
      "category": "brand-payment",
      "generic": false,
      "x": 52,
      "y": 772,
      "width": 53,
      "height": 50,
      "assetId": "wechat-pay-icon",
      "sourceStrategy": "original-crop",
      "selector": "[data-fidelity-id='wechat-pay-icon']"
    }
  ]
}
```

In `1:1` mode, non-generic icons must use `original-crop`, `repair-crop`, `vector-rebuild`, or `manual-svg`. Do not replace reference-specific business icons, payment icons, status dots, badges, or trust icons with `lucide-react`. Generic system symbols such as chevrons can use an icon library when their visual role is not reference-specific.

## Required Asset Manifest

`assets.manifest.json` must cover every non-text visual that is not safely expressible in code:

- exact brand marks
- payment icons
- custom badges
- custom timeline/status icons
- illustration crops
- faint line art
- decorative separators or background plates

Do not list only the obvious large illustrations.

For high-fidelity work, each non-code asset must include `sourceStrategy`, `repairStrategy`, `qualityGate`, `slotSize`, `targetPixels`, and `targetPath`.

Assets must be planned as pixels inside a component-owned slot. The slot belongs to the CSS box model; the asset pipeline owns crop, alpha, repair, scale, and compression.

For exact translucent assets:

- prefer PNG-32 source output with alpha
- optionally export WebP alpha for runtime size, but keep the PNG source
- do not export translucent assets as JPEG or with a fake white/cream background
- use at least 2x target pixels for production-quality mode
- record `backgroundMatched` and `backgroundColor` only when preserving the sampled background is better than alpha extraction

If a previous or initial plan used 2x/upscale and a later plan switches to 1x/none, include `downgradeReason`:

```json
{
  "id": "brand-lockup",
  "sourceStrategy": "repair-crop",
  "repairStrategy": ["none"],
  "slotSize": { "width": 238, "height": 51 },
  "targetPixels": { "width": 238, "height": 51 },
  "qualityGate": "exact",
  "densityPolicy": "screenshot-exact",
  "downgradeReason": "At DPR=1 the original crop matched the reference better than a resampled 2x crop.",
  "targetPath": "src/assets/original/repaired/brand-lockup.png"
}
```

## Asset Acceptance Gate

Planning an asset is not enough. Before a strict React implementation may consume exact assets, run the repair and scoring gates:

```powershell
node scripts/extract-reference-assets.mjs `
  --manifest assets.manifest.json `
  --source tmp/fidelity/clean-reference.png

node scripts/repair-asset.mjs `
  --manifest assets.manifest.json

node scripts/score-asset.mjs `
  --manifest assets.manifest.json `
  --fail-on-reject

node scripts/build-asset-contact-sheet.mjs `
  --manifest assets.manifest.json `
  --source tmp/fidelity/clean-reference.png `
  --fail-on-review

node scripts/validate-fidelity-plan.mjs `
  --blueprint tmp/fidelity/page-blueprint.json `
  --layout tmp/fidelity/layout-manifest.json `
  --assets assets.manifest.json `
  --elements tmp/fidelity/element-manifest.json `
  --icons tmp/fidelity/icon-inventory.json `
  --interactions tmp/fidelity/interaction-map.json `
  --mode strict `
  --enforce-asset-acceptance `
  --fail-on-error
```

Only set an asset to `status: "accepted"` after the repaired/vector output passes score, contact-sheet review, alpha checks, and 2x density requirements. If an exact screenshot crop must remain 1x for lower pixel diff, set `densityPolicy: "source-1x-accepted"` plus `downgradeReason` and record the diff evidence.

Do not compensate for failed assets with CSS nudges. Fix crop boxes, alpha extraction, vector rebuilds, output density, or background matching first.

## Required Font Handling

Editable UI text must remain real text and use CSS fonts. If system fonts do not match the reference:

1. Search official/open-source font sources.
2. Download or install the required weights.
3. Put font files under `src/assets/fonts/`.
4. Declare them in `src/theme/font-faces.css`.
5. Wire semantic font stacks through `src/theme/tokens.css`.
6. Rerun screenshot diff and DOM font audit.

Record source URL, license assumption, weights, fallback stack, and any subsetting decision in the task notes or reuse review. Do not embed commercial or brand fonts unless the user provides licensed files.

## Required Interaction Map

`interaction-map.json` records what should be clickable before implementation:

```json
{
  "interactions": [
    {
      "id": "switch-to-alipay",
      "targetName": "支付宝",
      "role": "button",
      "expectedChange": "payment method selected state switches to alipay"
    },
    {
      "id": "pay-submit",
      "targetName": "去支付",
      "role": "button",
      "expectedChange": "local status feedback appears"
    }
  ]
}
```

If the reference has no meaningful interactions, write an empty array plus `reason`.

## Region-Level Diff

After capturing the implementation screenshot, run:

```powershell
node scripts/compare-region-fidelity.mjs `
  --reference src/assets/original/reference.png `
  --actual tmp/fidelity/page-final.png `
  --regions tmp/fidelity/layout-manifest.json `
  --out-dir tmp/fidelity/region-diff `
  --threshold 0.1 `
  --max-diff-ratio 0.05 `
  --critical-max-diff-ratio 0.06
```

Fix the highest-failing critical region first. The report includes the worst 10 regions; use that list to drive the next iteration. Do not rely only on whole-page diff.

## Element And Font Audit

After render, run:

```powershell
node scripts/audit-rendered-elements.mjs `
  --url http://127.0.0.1:5173/ `
  --reference src/assets/original/reference.png `
  --elements tmp/fidelity/element-manifest.json `
  --out-dir tmp/fidelity/element-audit `
  --fail-on-error
```

Use the audit report to calibrate fonts and layout. If the page title, amount, button text, agreement copy, or status timeline differs in `font-family`, `font-size`, `font-weight`, or `line-height`, adjust CSS and rerun the audit. Any text overflow or disallowed overlap is a hard failure in strict mode.

## Stable Capture

Prefer a deterministic Playwright capture script over ad hoc browser REPL calls:

```powershell
node scripts/capture-fidelity.mjs `
  --url http://127.0.0.1:5173/ `
  --reference src/assets/original/reference.png `
  --out-dir tmp/fidelity/final `
  --regions tmp/fidelity/layout-manifest.json `
  --elements tmp/fidelity/element-manifest.json `
  --compare `
  --device-scale-factor 1 `
  --assert-no-fractional-scale-selector .payment-canvas
```

The script requires `playwright` or `playwright-core` in the target project. If it is missing, install it only when strict screenshot automation is needed.

## Delivery Status

For `1:1` requests, final status must be one of:

- `strict gate passed`
- `loose gate passed only`
- `未达 1:1`

If strict whole-page or critical-region gates fail, do not say "1:1 completed". Report the failed regions and next fixes.

Strict means: whole-page diff passes the 5% gate, every critical region passes the effective 6% cap, and element audit has no missing selector, drift, overflow, or disallowed overlap failures.
