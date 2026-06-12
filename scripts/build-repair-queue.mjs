#!/usr/bin/env node
import path from "node:path"
import { ensureDir, parseArgs, readJson, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const regionReportPath = args["region-report"] ? path.resolve(String(args["region-report"])) : null
const elementReportPath = args["element-report"] ? path.resolve(String(args["element-report"])) : null
const assetReportPath = args["asset-report"] ? path.resolve(String(args["asset-report"])) : null
const pageReportPath = args["page-report"] ? path.resolve(String(args["page-report"])) : null
const outputPath = path.resolve(String(args.out ?? "tmp/fidelity/repair-queue.json"))

const tasks = []

if (regionReportPath) {
  await addRegionTasks(regionReportPath)
}
if (elementReportPath) {
  await addElementTasks(elementReportPath)
}
if (assetReportPath) {
  await addAssetTasks(assetReportPath)
}
if (pageReportPath) {
  await addPageTasks(pageReportPath)
}

tasks.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))

const report = {
  tool: "build-repair-queue",
  pass: tasks.length === 0,
  inputs: {
    regionReportPath,
    elementReportPath,
    assetReportPath,
    pageReportPath,
  },
  tasks,
}

await ensureDir(path.dirname(outputPath))
await writeJson(outputPath, report)
console.log(JSON.stringify(report, null, 2))

if (!report.pass && args["fail-on-error"]) {
  process.exitCode = 1
}

async function addRegionTasks(filePath) {
  const report = await readJson(filePath)
  const regions = report.regions ?? report.regionResults ?? report.worstRegions ?? []
  const failedRegions = regions.filter((region) => {
    if (region.pass === false) return true
    const ratio = Number(region.diffRatio ?? region.mismatchRatio ?? region.maxDiffRatioActual)
    const max = Number(region.effectiveMaxDiffRatio ?? region.maxDiffRatio ?? report.maxDiffRatio)
    return Number.isFinite(ratio) && Number.isFinite(max) && ratio > max
  })

  for (const region of failedRegions.slice(0, 10)) {
    tasks.push({
      id: `region:${region.id ?? region.name ?? tasks.length + 1}`,
      category: "layout",
      priority: region.critical ? 90 : 70,
      source: filePath,
      target: region.id ?? region.name ?? "unknown-region",
      reason: `region diff failed with ratio ${region.diffRatio ?? region.mismatchRatio ?? "unknown"}`,
      nextAction: "Adjust layout, spacing, color, or asset integration for this region, then rerun region diff.",
    })
  }
}

async function addElementTasks(filePath) {
  const report = await readJson(filePath)
  const failures = Array.isArray(report.failures) ? report.failures : []
  for (const failure of failures) {
    tasks.push({
      id: `element:${tasks.length + 1}`,
      category: classifyElementFailure(failure),
      priority: 85,
      source: filePath,
      target: extractQuotedId(failure),
      reason: failure,
      nextAction: "Fix the DOM element bounds, typography, overflow, or selector mapping, then rerun element audit.",
    })
  }
}

async function addAssetTasks(filePath) {
  const report = await readJson(filePath)
  const assets = report.assets ?? []
  for (const asset of assets.filter((item) => item.pass === false || item.ok === false || item.failures?.length)) {
    tasks.push({
      id: `asset:${asset.id ?? tasks.length + 1}`,
      category: "asset",
      priority: 80,
      source: filePath,
      target: asset.id ?? asset.assetPath ?? "unknown-asset",
      reason: (asset.failures ?? ["asset failed scoring"]).join("; "),
      nextAction: "Repair, regenerate, crop, vectorize, or re-score this asset before page QA.",
    })
  }
}

async function addPageTasks(filePath) {
  const report = await readJson(filePath)
  if (report.pass !== false) {
    return
  }
  tasks.push({
    id: "page:diff",
    category: "layout",
    priority: 75,
    source: filePath,
    target: "page",
    reason: (report.failures ?? ["page-level fidelity gate failed"]).join("; "),
    nextAction: "Inspect worst regions, update the page, capture again, and rerun page diff.",
  })
}

function classifyElementFailure(message) {
  const text = String(message).toLowerCase()
  if (text.includes("font")) return "font"
  if (text.includes("overflow")) return "overflow"
  if (text.includes("overlap")) return "overflow"
  if (text.includes("position") || text.includes("size") || text.includes("selector")) return "layout"
  return "spacing"
}

function extractQuotedId(message) {
  const match = String(message).match(/'([^']+)'/)
  return match?.[1] ?? null
}
