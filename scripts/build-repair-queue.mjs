#!/usr/bin/env node
import path from "node:path"
import { ensureDir, parseArgs, readJson, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const regionReportPath = args["region-report"] ? path.resolve(String(args["region-report"])) : null
const elementReportPath = args["element-report"] ? path.resolve(String(args["element-report"])) : null
const assetReportPath = args["asset-report"] ? path.resolve(String(args["asset-report"])) : null
const pageReportPath = args["page-report"] ? path.resolve(String(args["page-report"])) : null
const diagnosisReportPath = args["diagnosis-report"] ? path.resolve(String(args["diagnosis-report"])) : null
const outputPath = path.resolve(String(args.out ?? "tmp/fidelity/repair-queue.json"))

const tasks = []

if (diagnosisReportPath) {
  await addDiagnosisTasks(diagnosisReportPath)
}
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
    diagnosisReportPath,
  },
  tasks,
}

await ensureDir(path.dirname(outputPath))
await writeJson(outputPath, report)
console.log(JSON.stringify(report, null, 2))

if (!report.pass && args["fail-on-error"]) {
  process.exitCode = 1
}

async function addDiagnosisTasks(filePath) {
  const report = await readJson(filePath)
  const findings = report.topFocus ?? report.findings ?? []
  for (const finding of findings.slice(0, 12)) {
    tasks.push({
      id: `diagnosis:${finding.id ?? finding.target ?? tasks.length + 1}`,
      category: finding.category ?? "unknown",
      priority: Number(finding.priority ?? 85) + 3,
      source: filePath,
      target: finding.target ?? "unknown",
      reason: finding.reason ?? "diagnosed fidelity mismatch",
      nextAction: finding.suggestedAction ?? "Fix the diagnosed cause, then rerun all fidelity gates.",
    })
  }
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
    const target = extractQuotedId(failure)
    const category = classifyElementFailure(failure, target)
    tasks.push({
      id: `element:${tasks.length + 1}`,
      category,
      priority: 85,
      source: filePath,
      target,
      reason: failure,
      nextAction: nextActionForElementCategory(category),
    })
  }
}

async function addAssetTasks(filePath) {
  const report = await readJson(filePath)
  const assets = report.assets ?? []
  for (const asset of assets.filter((item) => {
    const status = String(item.status ?? "").toLowerCase()
    return item.pass === false ||
      item.ok === false ||
      item.failures?.length ||
      ["needs-repair", "needs-review", "needs-regenerate", "rejected", "failed"].includes(status)
  })) {
    tasks.push({
      id: `asset:${asset.id ?? tasks.length + 1}`,
      category: "asset",
      priority: asset.qualityGate === "exact" ? 92 : 80,
      source: filePath,
      target: asset.id ?? asset.assetPath ?? "unknown-asset",
      reason: (asset.failures?.length ? asset.failures : [`asset status '${asset.status ?? "unknown"}' is not accepted`]).join("; "),
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

function classifyElementFailure(message, target = "") {
  const text = String(message).toLowerCase()
  if (text.includes("overlap")) return "overflow"
  if (text.includes("overflow") && isTypographyTarget(target)) return "font"
  if (text.includes("overflow")) return "overflow"
  if (text.includes("font")) return "font"
  if (text.includes("position") || text.includes("size") || text.includes("selector")) return "layout"
  return "spacing"
}

function nextActionForElementCategory(category) {
  if (category === "font") {
    return "Calibrate the font family, weight, line-height, and text slot width together; self-host a closer font when system fonts drift, then rerun element audit."
  }
  if (category === "overflow") {
    return "Fix the text slot, wrapping rule, or allowed overlap group; do not hide overflow unless the reference clips it."
  }
  if (category === "layout") {
    return "Move or resize the mapped DOM element to match element-manifest coordinates, then rerun element audit."
  }
  return "Fix the DOM element bounds, typography, overflow, or selector mapping, then rerun element audit."
}

function isTypographyTarget(target) {
  const value = String(target ?? "").toLowerCase()
  return [
    "title",
    "subtitle",
    "price",
    "amount",
    "agreement",
    "protocol",
    "button",
    "cta",
    "breadcrumb",
    "status",
    "timeline",
    "notice",
    "summary",
    "label",
    "copy",
    "text",
  ].some((keyword) => value.includes(keyword))
}

function extractQuotedId(message) {
  const match = String(message).match(/'([^']+)'/)
  return match?.[1] ?? null
}
