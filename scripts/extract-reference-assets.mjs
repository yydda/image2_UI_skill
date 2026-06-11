#!/usr/bin/env node
import path from "node:path"
import sharp from "sharp"
import {
  ensureDir,
  inferExtractedPath,
  parseArgs,
  readManifest,
  requireArg,
  resolvePath,
  writeJson,
} from "./fidelity-lib.mjs"
import { inspectReferenceImage } from "./reference-preflight-lib.mjs"

const args = parseArgs()
const manifestPath = path.resolve(requireArg(args, "manifest"))
const sourcePath = path.resolve(requireArg(args, "source"))
const outputDir = path.resolve(String(args["out-dir"] ?? "src/assets/original/extracted"))
const reportPath = path.resolve(String(args.report ?? path.join(outputDir, "extraction-report.json")))
const skipReferencePreflight = Boolean(args["skip-reference-preflight"])
const allowContaminatedSource = Boolean(args["allow-contaminated-source"])
const preflightReportPath = path.resolve(
  String(args["preflight-report"] ?? path.join(outputDir, "reference-preflight-report.json")),
)

const { assets } = await readManifest(manifestPath)
const sourceMeta = await sharp(sourcePath).metadata()
const results = []

await ensureDir(outputDir)

let preflight = null
if (!skipReferencePreflight) {
  preflight = await inspectReferenceImage(sourcePath, {
    redComponentMinArea: args["red-component-min-area"],
    edgeWidth: args["edge-width"],
  })
  await writeJson(preflightReportPath, preflight)

  if (!preflight.pass && !allowContaminatedSource) {
    const report = {
      tool: "extract-reference-assets",
      pass: false,
      skipped: true,
      sourcePath,
      manifestPath,
      outputDir,
      sourceSize: { width: sourceMeta.width, height: sourceMeta.height },
      preflightReportPath,
      preflight,
      failures: [
        "reference image preflight failed; provide a clean design canvas or rerun with --allow-contaminated-source only for non-exact assets",
        ...preflight.failures,
      ],
      assets: results,
    }

    await writeJson(reportPath, report)
    console.log(JSON.stringify(report, null, 2))
    process.exit(1)
  }
}

for (const asset of assets) {
  if (!asset.cropBox) {
    results.push({
      id: asset.id,
      ok: false,
      skipped: true,
      reason: "missing cropBox",
    })
    continue
  }

  const padding = Number(args.padding ?? asset.padding ?? 0)
  const left = Math.max(0, Math.floor(asset.cropBox.x - padding))
  const top = Math.max(0, Math.floor(asset.cropBox.y - padding))
  const right = Math.min(sourceMeta.width, Math.ceil(asset.cropBox.x + asset.cropBox.width + padding))
  const bottom = Math.min(sourceMeta.height, Math.ceil(asset.cropBox.y + asset.cropBox.height + padding))
  const width = Math.max(1, right - left)
  const height = Math.max(1, bottom - top)
  const outputPath = resolvePath(process.cwd(), asset.extractedPath) ?? inferExtractedPath(asset, outputDir)

  await ensureDir(path.dirname(outputPath))
  await sharp(sourcePath)
    .extract({ left, top, width, height })
    .png()
    .toFile(outputPath)

  results.push({
    id: asset.id,
    ok: true,
    sourcePath,
    outputPath,
    cropBox: { x: left, y: top, width, height },
    requestedCropBox: asset.cropBox,
    padding,
  })
}

const failedAssets = results.filter((asset) => !asset.ok)
const report = {
  tool: "extract-reference-assets",
  pass: failedAssets.length === 0 && (!preflight || preflight.pass || allowContaminatedSource),
  sourcePath,
  manifestPath,
  outputDir,
  sourceSize: { width: sourceMeta.width, height: sourceMeta.height },
  preflightReportPath: preflight ? preflightReportPath : null,
  preflight,
  warnings:
    preflight && !preflight.pass && allowContaminatedSource
      ? [
          "contaminated source was allowed explicitly; do not use these crops for qualityGate: exact assets",
        ]
      : preflight?.warnings ?? [],
  assets: results,
}

await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))
