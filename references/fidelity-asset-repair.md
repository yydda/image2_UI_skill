# Fidelity Asset Repair Workflow

Use this reference when the user expects 1:1 or strict high-fidelity recreation from a screenshot/design image.

## Priority Order

For every visual asset, choose the first viable strategy:

1. `original-crop`: crop the exact source region from the user-provided design image.
2. `repair-crop`: crop, then repair with alpha removal, upscaling, sharpening, or background matching.
3. `vector-rebuild`: vectorize or manually rebuild precise line art, icons, brand marks, and simple custom graphics.
4. `background-matched`: keep a light background if transparency damages fine lines, and match the UI container color.
5. `image_gen-fallback`: use built-in `image_gen` only for non-exact missing assets, background extension, concept illustration, or user-approved variants.

Never use `image_gen-fallback` for `qualityGate: exact` assets such as logos, brand marks, payment icons, exact product screenshots, or precise line art.

## Reference Source Gate

Asset repair only works when the source is the design canvas. Run reference preflight before extraction:

```powershell
node scripts/inspect-reference-image.mjs `
  --source <design.png> `
  --out-dir tmp/fidelity/reference-preflight `
  --fail-on-contamination
```

If the source contains red review arrows, watermark text, browser scrollbars, floating download/zoom controls, chat/assistant widgets, stickers, or any other non-design overlay, stop. Ask for a clean export, or first create `tmp/fidelity/clean-reference.png` by cropping and masking the design canvas. Use the clean file for all crop boxes, repair, score, screenshot diff, and region diff.

`scripts/extract-reference-assets.mjs` runs this preflight automatically. It rejects contaminated sources unless `--allow-contaminated-source` is passed explicitly. Do not use that override for `qualityGate: exact` assets.

## Manifest Fields

Each high-fidelity asset should include:

```json
{
  "id": "document-search-illustration",
  "sourceStrategy": "repair-crop",
  "repairStrategy": ["rembg-alpha", "upscale"],
  "transparentRequired": true,
  "cropBox": { "x": 55, "y": 292, "width": 158, "height": 148 },
  "slotSize": { "width": 158, "height": 148 },
  "targetPixels": { "width": 384, "height": 360 },
  "safePadding": 12,
  "alphaPolicy": "semi-transparent-preserve",
  "densityPolicy": "production-quality",
  "qualityGate": "exact",
  "status": "needs-repair",
  "targetPath": "src/assets/original/repaired/document-search-illustration.png"
}
```

Allowed `sourceStrategy` values:

- `original-crop`
- `repair-crop`
- `vector-rebuild`
- `image_gen-fallback`
- `code`

Allowed `repairStrategy` values:

- `none`
- `flat-bg-alpha`
- `rembg-alpha`
- `upscale`
- `vectorize-svg`
- `manual-svg`

Allowed `qualityGate` values:

- `exact`
- `close`
- `concept`

Recommended alpha policies:

- `solid-alpha`: opaque subject with transparent outside edges
- `semi-transparent-preserve`: preserve translucent strokes, shadows, glow, and paper texture
- `background-matched`: keep sampled source background because alpha extraction would destroy thin lines

Use PNG-32 as the repaired source format for alpha-heavy exact assets. WebP alpha can be added as an optimized runtime variant, but keep the PNG source for review and future repair.

## Tool Sequence

Run these from the project using the skill:

```powershell
.\scripts\setup-fidelity-tools.cmd
node scripts/inspect-reference-image.mjs --source <design.png> --out-dir tmp/fidelity/reference-preflight --fail-on-contamination
node scripts/validate-fidelity-plan.mjs --blueprint tmp/fidelity/page-blueprint.json --layout tmp/fidelity/layout-manifest.json --assets assets.manifest.json --elements tmp/fidelity/element-manifest.json --icons tmp/fidelity/icon-inventory.json --interactions tmp/fidelity/interaction-map.json --mode strict
node scripts/extract-reference-assets.mjs --manifest <manifest.json> --source <design.png>
node scripts/repair-asset.mjs --manifest <manifest.json>
node scripts/score-asset.mjs --manifest <manifest.json>
node scripts/capture-fidelity.mjs --url <local-url> --reference <design.png> --out-dir tmp/fidelity/final --compare --regions tmp/fidelity/layout-manifest.json --elements tmp/fidelity/element-manifest.json
node scripts/compare-fidelity.mjs --reference <design.png> --actual <screenshot.png>
node scripts/compare-region-fidelity.mjs --reference <design.png> --actual <screenshot.png> --regions tmp/fidelity/layout-manifest.json --critical-max-diff-ratio 0.06
node scripts/audit-rendered-elements.mjs --url <local-url> --reference <design.png> --elements tmp/fidelity/element-manifest.json
```

Use `.\scripts\setup-fidelity-tools.cmd -CheckOnly` on Windows when only checking whether required tools are available. If you must call the PowerShell script directly, use `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-fidelity-tools.ps1 -CheckOnly`; never open the `.ps1` file through Windows Explorer or the Open With dialog.
Use `capture-fidelity.mjs` when Playwright is installed in the target project; pass `--elements tmp/fidelity/element-manifest.json` so the same run checks DOM bounding boxes, font drift, text overflow, and disallowed overlap. Otherwise capture with the Codex browser and still run the diff scripts.

## Repair Rules

- Logos, payment icons, brand seals, fine line city backgrounds, and exact UI decorations should use `vector-rebuild`, not `image_gen-fallback`.
- Paper characters, document illustrations, locks, and complex decorative bitmaps should use `repair-crop` with 8-16px crop padding.
- If the crop background is flat, use `flat-bg-alpha`.
- If the background is complex, use `rembg-alpha`.
- If the crop is too small, use `upscale`; Real-ESRGAN is preferred when available, and `sharp` resize/sharpen is the fallback.
- For `vectorize-svg`, prefer VTracer when available; otherwise use the bundled Node `potrace` fallback for simple monochrome marks and line art.
- If transparency damages thin lines, use `background-matched` and record `backgroundColor`.
- If the asset is supposed to be transparent, reject white/cream matte backgrounds. A fake matching background is only allowed when explicitly marked `background-matched`.
- For translucent decorations and line art, preserve alpha gradients instead of thresholding everything into hard edges.
- Crop with safe padding when shadows or soft edges exist, then fit the asset into a CSS slot with `object-fit: contain`.

## Scoring And Rejection

Reject an asset when:

- final raster pixels are smaller than `targetPixels`
- `transparentRequired` is true but no alpha channel or transparent corners exist
- alpha-heavy exact assets contain matte edges, white/cream backgrounds, hard cutouts, or dirty borders beyond the accepted threshold
- `qualityGate: exact` uses `image_gen-fallback`
- vector rebuild output is not valid SVG
- image generation creates pseudo text, wrong subject, logo drift, extra UI, watermark, or unrelated objects

For `image_gen-fallback`, include `rejectIf` or equivalent prompt rejection criteria. Retry at most twice, and include the previous failure reason in the next prompt.

## Fallback Prompt Shape

Do not prompt with whole-page language. Prompt one asset only:

```text
Asset role: right status card bottom line-art background.
Target slot: 320x80, exported at 640x160.
Reference role: match the source crop's thin warm beige line art and low contrast.
Must keep: minimal city skyline outline, very thin strokes, warm paper palette.
Must avoid: readable text, logo, watermark, UI controls, characters, heavy shadows.
Reject if: subject is not a low-contrast city line decoration, line weight is thick, or any text/logo appears.
```
