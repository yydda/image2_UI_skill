#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import {
  findExistingPath,
  inferRepairedPath,
  parseArgs,
  readJson,
  readManifest,
  requireArg,
  resolvePath,
  writeJson,
} from "./fidelity-lib.mjs"

const args = parseArgs()
const manifestPath = path.resolve(requireArg(args, "manifest"))
const outputDir = path.resolve(String(args["assets-dir"] ?? "src/assets/original/repaired"))
const reportPath = path.resolve(String(args.report ?? path.join(outputDir, "asset-score-report.json")))
const repairReportPath = args["repair-report"]
  ? path.resolve(String(args["repair-report"]))
  : path.join(outputDir, "repair-report.json")
const repairReport = await readOptionalJson(repairReportPath)
const repairedById = new Map(
  (repairReport?.assets ?? [])
    .filter((entry) => entry.id && entry.outputPath)
    .map((entry) => [entry.id, entry.outputPath]),
)
const { assets } = await readManifest(manifestPath)
const results = []

for (const asset of assets) {
  const assetPath = findExistingPath([
    resolvePath(process.cwd(), asset.repairedPath),
    repairedById.get(asset.id),
    resolvePath(process.cwd(), asset.targetPath),
    inferRepairedPath(asset, outputDir),
  ])
  const failures = []
  const warnings = []
  let metrics = {}

  if (!assetPath) {
    results.push({
      id: asset.id,
      pass: false,
      status: "rejected",
      failures: ["asset file not found"],
      sourceStrategy: asset.sourceStrategy,
      repairStrategy: asset.repairStrategy,
    })
    continue
  }

  if (asset.qualityGate === "exact" && asset.sourceStrategy === "image_gen-fallback") {
    failures.push("exact assets cannot use image_gen-fallback")
  }

  if (asset.sourceStrategy === "image_gen-fallback") {
    const promptHasRejectRule =
      Boolean(asset.rejectIf) || /reject if|拒收|不合格|失败原因/i.test(String(asset.prompt))
    if (!promptHasRejectRule) {
      failures.push("image_gen-fallback assets must define rejectIf or prompt rejection criteria")
    }
  }

  if (asset.backgroundMatched && !asset.backgroundColor) {
    failures.push("background-matched assets must record backgroundColor")
  }

  const extension = path.extname(assetPath).toLowerCase()

  if (extension === ".svg") {
    const svgText = await fs.readFile(assetPath, "utf8")
    if (!svgText.includes("<svg")) {
      failures.push("vector asset is not valid SVG text")
    }
    if (asset.sourceStrategy === "vector-rebuild" && svgText.includes("<image")) {
      warnings.push("vector-rebuild output embeds a raster image; prefer manual SVG or vtracer output")
    }
    metrics = { format: "svg" }
  } else {
    const metadata = await sharp(assetPath).metadata()
    const alpha = await alphaMetrics(assetPath)
    metrics = {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      hasAlpha: Boolean(metadata.hasAlpha),
      transparentPixelRatio: alpha.transparentPixelRatio,
      transparentCorners: alpha.transparentCorners,
      edgeOpaqueRatio: alpha.edgeOpaqueRatio,
    }

    const requiredWidth = asset.targetPixels?.width ?? (asset.slotSize ? Math.ceil(asset.slotSize.width * 2) : null)
    const requiredHeight =
      asset.targetPixels?.height ?? (asset.slotSize ? Math.ceil(asset.slotSize.height * 2) : null)

    if (requiredWidth && metadata.width < requiredWidth) {
      failures.push(`asset width ${metadata.width} is below required width ${requiredWidth}`)
    }

    if (requiredHeight && metadata.height < requiredHeight) {
      failures.push(`asset height ${metadata.height} is below required height ${requiredHeight}`)
    }

    if (asset.transparentRequired) {
      if (!metadata.hasAlpha) {
        failures.push("transparentRequired asset has no alpha channel")
      } else if (alpha.transparentPixelRatio < 0.01) {
        failures.push("transparentRequired asset has too few transparent pixels")
      } else if (!alpha.transparentCorners) {
        failures.push("transparentRequired asset corners are not transparent")
      }
    }
  }

  const pass = failures.length === 0
  results.push({
    id: asset.id,
    pass,
    status: pass ? "accepted" : "rejected",
    assetPath,
    sourceStrategy: asset.sourceStrategy,
    repairStrategy: asset.repairStrategy,
    transparentRequired: asset.transparentRequired,
    qualityGate: asset.qualityGate,
    metrics,
    failures,
    warnings,
  })
}

const report = {
  tool: "score-asset",
  manifestPath,
  pass: results.every((result) => result.pass),
  assets: results,
}

await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

if (!report.pass && args["fail-on-reject"]) {
  process.exitCode = 1
}

async function readOptionalJson(filePath) {
  try {
    return await readJson(filePath)
  } catch {
    return null
  }
}

async function alphaMetrics(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let transparent = 0
  let edgeOpaque = 0
  let edgePixels = 0
  const cornerAlpha = []

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels
      const alpha = data[offset + 3]
      if (alpha <= 8) {
        transparent += 1
      }
      if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) {
        edgePixels += 1
        if (alpha > 12) {
          edgeOpaque += 1
        }
      }
    }
  }

  for (const [x, y] of [
    [0, 0],
    [info.width - 1, 0],
    [0, info.height - 1],
    [info.width - 1, info.height - 1],
  ]) {
    const offset = (y * info.width + x) * info.channels
    cornerAlpha.push(data[offset + 3])
  }

  return {
    transparentPixelRatio: Number((transparent / (info.width * info.height)).toFixed(6)),
    transparentCorners: cornerAlpha.every((alpha) => alpha <= 12),
    edgeOpaqueRatio: Number((edgeOpaque / edgePixels).toFixed(6)),
  }
}
