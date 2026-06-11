#!/usr/bin/env node
import path from "node:path"
import pixelmatch from "pixelmatch"
import sharp from "sharp"
import { ensureDir, parseArgs, requireArg, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const referencePath = path.resolve(requireArg(args, "reference"))
const actualPath = path.resolve(requireArg(args, "actual"))
const outputDir = path.resolve(String(args["out-dir"] ?? "tmp/fidelity"))
const threshold = Number(args.threshold ?? 0.1)
const maxDiffRatio = Number(args["max-diff-ratio"] ?? 0.05)
const allowSizeMismatch = Boolean(args["allow-size-mismatch"])

await ensureDir(outputDir)

const referenceMeta = await sharp(referencePath).metadata()
const actualMeta = await sharp(actualPath).metadata()
const width = referenceMeta.width
const height = referenceMeta.height
const sizeMatch = referenceMeta.width === actualMeta.width && referenceMeta.height === actualMeta.height

const referenceBuffer = await sharp(referencePath)
  .ensureAlpha()
  .raw()
  .toBuffer()

const actualBuffer = await sharp(actualPath)
  .resize(width, height, { fit: "fill" })
  .ensureAlpha()
  .raw()
  .toBuffer()

const diffBuffer = Buffer.alloc(width * height * 4)
const diffPixels = pixelmatch(referenceBuffer, actualBuffer, diffBuffer, width, height, {
  threshold,
  includeAA: false,
})
const totalPixels = width * height
const diffRatio = diffPixels / totalPixels

const normalizedReference = path.join(outputDir, "reference.png")
const normalizedActual = path.join(outputDir, "actual.png")
const diffPath = path.join(outputDir, "diff.png")
const reportPath = path.join(outputDir, "fidelity-report.json")

await sharp(referenceBuffer, { raw: { width, height, channels: 4 } }).png().toFile(normalizedReference)
await sharp(actualBuffer, { raw: { width, height, channels: 4 } }).png().toFile(normalizedActual)
await sharp(diffBuffer, { raw: { width, height, channels: 4 } }).png().toFile(diffPath)

const pass = (sizeMatch || allowSizeMismatch) && diffRatio <= maxDiffRatio
const report = {
  tool: "compare-fidelity",
  pass,
  referencePath,
  actualPath,
  normalizedReference,
  normalizedActual,
  diffPath,
  referenceSize: { width: referenceMeta.width, height: referenceMeta.height },
  actualSize: { width: actualMeta.width, height: actualMeta.height },
  normalizedSize: { width, height },
  sizeMatch,
  allowSizeMismatch,
  threshold,
  maxDiffRatio,
  diffPixels,
  totalPixels,
  diffRatio: Number(diffRatio.toFixed(6)),
  failures: [
    ...(!sizeMatch && !allowSizeMismatch ? ["screenshot size does not match reference size"] : []),
    ...(diffRatio > maxDiffRatio ? ["pixel diff ratio exceeds maxDiffRatio"] : []),
  ],
}

await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

if (!pass && args["fail-on-diff"]) {
  process.exitCode = 1
}
