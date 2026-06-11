#!/usr/bin/env node
import path from "node:path"
import pixelmatch from "pixelmatch"
import sharp from "sharp"
import { ensureDir, parseArgs, parseBox, readJson, requireArg, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const referencePath = path.resolve(requireArg(args, "reference"))
const actualPath = path.resolve(requireArg(args, "actual"))
const regionsPath = path.resolve(requireArg(args, "regions"))
const outputDir = path.resolve(String(args["out-dir"] ?? "tmp/fidelity/region-diff"))
const threshold = Number(args.threshold ?? 0.1)
const defaultMaxDiffRatio = Number(args["max-diff-ratio"] ?? 0.05)
const criticalMaxDiffRatio = Number(args["critical-max-diff-ratio"] ?? 0.06)
const failOnDiff = Boolean(args["fail-on-diff"])

await ensureDir(outputDir)

const regionDocument = await readJson(regionsPath)
const regions = normalizeRegions(regionDocument)
if (regions.length === 0) {
  throw new Error("Region manifest must contain regions or boxes")
}

const referenceMeta = await sharp(referencePath).metadata()
const actualMeta = await sharp(actualPath).metadata()
const failures = []
const warnings = []
const results = []

for (const region of regions) {
  const regionDir = path.join(outputDir, safeName(region.id))
  await ensureDir(regionDir)

  const box = clampRegion(region, referenceMeta.width, referenceMeta.height)
  if (box.width !== region.width || box.height !== region.height || box.x !== region.x || box.y !== region.y) {
    warnings.push(`region '${region.id}' was clamped to fit the reference image`)
  }

  const configuredMaxDiffRatio = Number(region.maxDiffRatio ?? defaultMaxDiffRatio)
  const regionMaxDiffRatio = region.critical
    ? Math.min(configuredMaxDiffRatio, criticalMaxDiffRatio)
    : configuredMaxDiffRatio
  const referenceBuffer = await sharp(referencePath)
    .extract(toSharpBox(box))
    .ensureAlpha()
    .raw()
    .toBuffer()

  const actualBuffer = await sharp(actualPath)
    .resize(referenceMeta.width, referenceMeta.height, { fit: "fill" })
    .extract(toSharpBox(box))
    .ensureAlpha()
    .raw()
    .toBuffer()

  const diffBuffer = Buffer.alloc(box.width * box.height * 4)
  const diffPixels = pixelmatch(referenceBuffer, actualBuffer, diffBuffer, box.width, box.height, {
    threshold,
    includeAA: false,
  })
  const totalPixels = box.width * box.height
  const diffRatio = diffPixels / totalPixels
  const pass = diffRatio <= regionMaxDiffRatio

  const normalizedReference = path.join(regionDir, "reference.png")
  const normalizedActual = path.join(regionDir, "actual.png")
  const diffPath = path.join(regionDir, "diff.png")

  await sharp(referenceBuffer, { raw: { width: box.width, height: box.height, channels: 4 } }).png().toFile(normalizedReference)
  await sharp(actualBuffer, { raw: { width: box.width, height: box.height, channels: 4 } }).png().toFile(normalizedActual)
  await sharp(diffBuffer, { raw: { width: box.width, height: box.height, channels: 4 } }).png().toFile(diffPath)

  if (!pass) {
    failures.push(`region '${region.id}' diffRatio ${diffRatio.toFixed(6)} exceeds ${regionMaxDiffRatio}`)
  }

  results.push({
    id: region.id,
    pass,
    critical: Boolean(region.critical),
    box,
    threshold,
    configuredMaxDiffRatio,
    criticalMaxDiffRatio: region.critical ? criticalMaxDiffRatio : null,
    maxDiffRatio: regionMaxDiffRatio,
    diffPixels,
    totalPixels,
    diffRatio: Number(diffRatio.toFixed(6)),
    normalizedReference,
    normalizedActual,
    diffPath,
  })
}

const sorted = [...results].sort((a, b) => b.diffRatio - a.diffRatio)
const criticalFailures = results.filter((region) => region.critical && !region.pass)
const pass = failures.length === 0
const report = {
  tool: "compare-region-fidelity",
  pass,
  referencePath,
  actualPath,
  regionsPath,
  outputDir,
  referenceSize: { width: referenceMeta.width, height: referenceMeta.height },
  actualSize: { width: actualMeta.width, height: actualMeta.height },
  threshold,
  defaultMaxDiffRatio,
  criticalMaxDiffRatio,
  regions: results,
  worstRegions: sorted.slice(0, 10).map(({ id, diffRatio, pass, critical }) => ({ id, diffRatio, pass, critical })),
  criticalFailures: criticalFailures.map((region) => region.id),
  failures,
  warnings,
}

await writeJson(path.join(outputDir, "region-fidelity-report.json"), report)
console.log(JSON.stringify(report, null, 2))

if (!pass && failOnDiff) {
  process.exitCode = 1
}

function normalizeRegions(document) {
  const candidates = [
    document?.regions,
    document?.boxes,
    document?.layout?.regions,
    document?.canvas?.regions,
  ].find((value) => Array.isArray(value))

  return (candidates ?? [])
    .map((raw, index) => {
      const box = parseBox(raw)
      return {
        id: String(raw.id ?? raw.name ?? `region-${index + 1}`),
        x: Math.round(Number(box.x)),
        y: Math.round(Number(box.y)),
        width: Math.round(Number(box.width)),
        height: Math.round(Number(box.height)),
        critical: Boolean(raw.critical),
        maxDiffRatio: raw.maxDiffRatio ?? raw["maxDiffRatio"] ?? null,
      }
    })
    .filter((region) => region.width > 0 && region.height > 0)
}

function clampRegion(region, imageWidth, imageHeight) {
  const x = Math.max(0, Math.min(region.x, imageWidth - 1))
  const y = Math.max(0, Math.min(region.y, imageHeight - 1))
  const width = Math.max(1, Math.min(region.width, imageWidth - x))
  const height = Math.max(1, Math.min(region.height, imageHeight - y))
  return { x, y, width, height }
}

function toSharpBox(box) {
  return {
    left: box.x,
    top: box.y,
    width: box.width,
    height: box.height,
  }
}

function safeName(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "region"
}
