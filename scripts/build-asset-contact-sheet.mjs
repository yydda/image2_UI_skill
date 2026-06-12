#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import {
  ensureDir,
  findExistingPath,
  parseArgs,
  readManifest,
  requireArg,
  resolvePath,
  writeJson,
} from "./fidelity-lib.mjs"

const args = parseArgs()
const manifestPath = path.resolve(requireArg(args, "manifest"))
const sourcePath = args.source ? path.resolve(String(args.source)) : null
const outputPath = path.resolve(String(args.out ?? "tmp/fidelity/asset-contact-sheet.html"))
const reportPath = path.resolve(String(args.report ?? "tmp/fidelity/asset-contact-sheet.json"))
const thumbWidth = Number(args["thumb-width"] ?? 220)
const thumbHeight = Number(args["thumb-height"] ?? 160)
const { assets, manifestDir } = await readManifest(manifestPath)

const cards = []
for (const asset of assets) {
  const preview = await makePreview(asset)
  const failures = []

  if (!preview.src) {
    failures.push("no existing asset/crop preview")
  }
  if (asset.qualityGate === "exact" && asset.sourceStrategy === "image_gen-fallback") {
    failures.push("exact asset cannot use image_gen-fallback")
  }
  if (asset.transparentRequired && asset.backgroundMatched) {
    failures.push("transparentRequired conflicts with backgroundMatched")
  }

  cards.push({
    id: asset.id,
    type: asset.type,
    uiPosition: asset.uiPosition,
    sourceStrategy: asset.sourceStrategy,
    repairStrategy: asset.repairStrategy,
    transparentRequired: asset.transparentRequired,
    backgroundMatched: asset.backgroundMatched,
    backgroundColor: asset.backgroundColor,
    cropBox: asset.cropBox,
    slotSize: asset.slotSize,
    targetPixels: asset.targetPixels,
    qualityGate: asset.qualityGate,
    status: failures.length ? "needs-review" : asset.status,
    preview,
    failures,
  })
}

const report = {
  tool: "build-asset-contact-sheet",
  manifestPath,
  sourcePath,
  outputPath,
  assetCount: cards.length,
  needsReview: cards.filter((card) => card.failures.length > 0).map((card) => card.id),
  assets: cards,
}

await ensureDir(path.dirname(outputPath))
await fs.writeFile(outputPath, renderHtml(report), "utf8")
await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

if (report.needsReview.length > 0 && args["fail-on-review"]) {
  process.exitCode = 1
}

async function makePreview(asset) {
  const candidates = [
    resolveFromManifest(asset.repairedPath),
    resolveFromManifest(asset.targetPath),
    resolveFromManifest(asset.extractedPath),
    resolveFromManifest(asset.inputPath),
  ]
  const existing = findExistingPath(candidates)
  if (existing) {
    return {
      kind: "file",
      path: existing,
      src: await imageDataUri(existing),
    }
  }

  if (sourcePath && asset.cropBox) {
    try {
      return {
        kind: "source-crop",
        path: sourcePath,
        src: await cropDataUri(sourcePath, asset.cropBox),
      }
    } catch (error) {
      return {
        kind: "error",
        path: sourcePath,
        src: null,
        error: error.message,
      }
    }
  }

  return { kind: "missing", path: null, src: null }
}

function resolveFromManifest(maybePath) {
  return resolvePath(manifestDir, maybePath) ?? resolvePath(process.cwd(), maybePath)
}

async function imageDataUri(filePath) {
  const buffer = await sharp(filePath)
    .resize(thumbWidth, thumbHeight, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer()
  return `data:image/png;base64,${buffer.toString("base64")}`
}

async function cropDataUri(filePath, box) {
  const metadata = await sharp(filePath).metadata()
  const left = Math.max(0, Math.round(box.x))
  const top = Math.max(0, Math.round(box.y))
  const width = Math.max(1, Math.min(Math.round(box.width), metadata.width - left))
  const height = Math.max(1, Math.min(Math.round(box.height), metadata.height - top))
  const buffer = await sharp(filePath)
    .extract({ left, top, width, height })
    .resize(thumbWidth, thumbHeight, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer()
  return `data:image/png;base64,${buffer.toString("base64")}`
}

function renderHtml(report) {
  const rows = report.assets.map((asset) => {
    const preview = asset.preview.src
      ? `<img src="${asset.preview.src}" alt="${escapeHtml(asset.id)} preview">`
      : `<div class="missing">No preview</div>`
    const failures = asset.failures.length
      ? `<ul class="failures">${asset.failures.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : `<p class="ok">ready for implementation review</p>`
    return `
      <article class="card" data-asset-id="${escapeHtml(asset.id)}">
        <div class="preview">${preview}</div>
        <div class="meta">
          <h2>${escapeHtml(asset.id)}</h2>
          <p>${escapeHtml(asset.uiPosition || asset.type || "asset")}</p>
          <dl>
            <dt>source</dt><dd>${escapeHtml(asset.sourceStrategy)}</dd>
            <dt>repair</dt><dd>${escapeHtml(asset.repairStrategy.join(" + "))}</dd>
            <dt>quality</dt><dd>${escapeHtml(asset.qualityGate)}</dd>
            <dt>transparent</dt><dd>${asset.transparentRequired ? "required" : "no"}</dd>
            <dt>crop</dt><dd>${formatBox(asset.cropBox)}</dd>
            <dt>slot</dt><dd>${formatSize(asset.slotSize)}</dd>
            <dt>target</dt><dd>${formatSize(asset.targetPixels)}</dd>
          </dl>
          ${failures}
        </div>
      </article>`
  })

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Moni UI Asset Contact Sheet</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; background: #f7f5f1; color: #241f1a; }
    header { padding: 28px 32px 16px; border-bottom: 1px solid #e4d9cd; background: #fffaf4; }
    h1 { margin: 0; font-size: 24px; }
    header p { margin: 8px 0 0; color: #6b625a; }
    main { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; padding: 24px 32px 40px; }
    .card { display: grid; grid-template-columns: 150px 1fr; gap: 14px; min-height: 190px; padding: 14px; border: 1px solid #e4d9cd; border-radius: 8px; background: #fffdf9; box-shadow: 0 12px 30px rgb(45 35 25 / 6%); }
    .preview { display: grid; place-items: center; min-height: 150px; border: 1px dashed #dacbbb; border-radius: 6px; background: linear-gradient(45deg, #f7f1e8 25%, transparent 25%), linear-gradient(-45deg, #f7f1e8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f7f1e8 75%), linear-gradient(-45deg, transparent 75%, #f7f1e8 75%); background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0; }
    .preview img { max-width: 100%; max-height: 150px; object-fit: contain; }
    .missing { color: #aa3b2d; font-size: 13px; }
    h2 { margin: 0; font-size: 16px; }
    .meta p { margin: 4px 0 10px; color: #6b625a; font-size: 13px; }
    dl { display: grid; grid-template-columns: 80px 1fr; gap: 4px 8px; margin: 0; font-size: 12px; }
    dt { color: #8c8177; }
    dd { margin: 0; color: #312a24; overflow-wrap: anywhere; }
    .failures { margin: 10px 0 0; padding-left: 18px; color: #b22b22; font-size: 12px; }
    .ok { margin: 10px 0 0; color: #16815a; font-size: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>Moni UI Asset Contact Sheet</h1>
    <p>${report.assetCount} assets · ${report.needsReview.length} need review · manifest ${escapeHtml(report.manifestPath)}</p>
  </header>
  <main>${rows.join("\n")}</main>
</body>
</html>`
}

function formatBox(box) {
  if (!box) return "none"
  return `${box.x}, ${box.y}, ${box.width}x${box.height}`
}

function formatSize(size) {
  if (!size) return "none"
  return `${size.width}x${size.height}`
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
