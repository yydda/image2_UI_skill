#!/usr/bin/env node
import path from "node:path"
import { ensureDir, parseArgs, readJson, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const outputPath = path.resolve(String(args.out ?? "tmp/fidelity/diff-diagnosis.json"))
const inputs = {
  pageReportPath: resolveOptional(args["page-report"]),
  regionReportPath: resolveOptional(args["region-report"]),
  elementReportPath: resolveOptional(args["element-report"]),
  assetReportPath: resolveOptional(args["asset-report"]),
}
const findings = []

if (inputs.pageReportPath) {
  await addPageFindings(inputs.pageReportPath)
}
if (inputs.regionReportPath) {
  await addRegionFindings(inputs.regionReportPath)
}
if (inputs.elementReportPath) {
  await addElementFindings(inputs.elementReportPath)
}
if (inputs.assetReportPath) {
  await addAssetFindings(inputs.assetReportPath)
}

findings.sort((a, b) => b.priority - a.priority || a.target.localeCompare(b.target))
const byCategory = groupBy(findings, "category")
const report = {
  tool: "diagnose-fidelity-diff",
  pass: findings.length === 0,
  inputs,
  summary: Object.fromEntries(Object.entries(byCategory).map(([key, value]) => [key, value.length])),
  findings,
  topFocus: findings.slice(0, 10),
}

await ensureDir(path.dirname(outputPath))
await writeJson(outputPath, report)
console.log(JSON.stringify(report, null, 2))

if (!report.pass && args["fail-on-findings"]) {
  process.exitCode = 1
}

function resolveOptional(value) {
  return value ? path.resolve(String(value)) : null
}

async function addPageFindings(filePath) {
  const report = await readJson(filePath)
  if (report.pass !== false) {
    return
  }
  for (const failure of report.failures ?? ["page-level diff failed"]) {
    findings.push({
      id: `page:${findings.length + 1}`,
      category: classifyText(failure, "layout"),
      priority: 75,
      source: filePath,
      target: "page",
      reason: failure,
      suggestedAction: "Compare the full screenshot, then prioritize the worst region report instead of making broad page-wide edits.",
    })
  }
}

async function addRegionFindings(filePath) {
  const report = await readJson(filePath)
  const regions = report.regions ?? report.regionResults ?? report.worstRegions ?? []
  for (const region of regions) {
    const ratio = Number(region.diffRatio ?? region.mismatchRatio)
    const max = Number(region.maxDiffRatio ?? region.effectiveMaxDiffRatio ?? report.maxDiffRatio)
    if (region.pass !== false && !(Number.isFinite(ratio) && Number.isFinite(max) && ratio > max)) {
      continue
    }
    const target = String(region.id ?? region.name ?? "region")
    findings.push({
      id: `region:${target}`,
      category: classifyText(target, region.critical ? "layout" : "spacing"),
      priority: region.critical ? 92 : 78,
      source: filePath,
      target,
      reason: `region diff ${formatRatio(ratio)} exceeds ${Number.isFinite(max) ? max : "threshold"}`,
      evidence: {
        diffRatio: Number.isFinite(ratio) ? ratio : null,
        maxDiffRatio: Number.isFinite(max) ? max : null,
        diffPath: region.diffPath ?? null,
        referencePath: region.normalizedReference ?? null,
        actualPath: region.normalizedActual ?? null,
      },
      suggestedAction: suggestedActionForRegion(target),
    })
  }
}

async function addElementFindings(filePath) {
  const report = await readJson(filePath)
  for (const failure of report.failures ?? []) {
    const target = extractQuotedId(failure) ?? "element"
    const category = classifyElementFailure(failure, target)
    findings.push({
      id: `element:${target}:${findings.length + 1}`,
      category,
      priority: failure.includes("overlap") || failure.includes("overflow") ? 90 : 82,
      source: filePath,
      target,
      reason: failure,
      suggestedAction: suggestedActionForElement(failure, target, category),
    })
  }
  for (const warning of report.warnings ?? []) {
    findings.push({
      id: `element-warning:${findings.length + 1}`,
      category: classifyText(warning, "font"),
      priority: 48,
      source: filePath,
      target: extractQuotedId(warning) ?? "element",
      reason: warning,
      suggestedAction: "Adjust typography token or component class only after higher-priority failures are fixed.",
    })
  }
}

async function addAssetFindings(filePath) {
  const report = await readJson(filePath)
  const assets = report.assets ?? []
  for (const asset of assets) {
    const status = String(asset.status ?? "").toLowerCase()
    const blockedStatus = ["needs-repair", "needs-review", "needs-regenerate", "rejected", "failed"].includes(status)
    if (asset.pass !== false && asset.ok !== false && !asset.failures?.length && !blockedStatus) {
      continue
    }
    findings.push({
      id: `asset:${asset.id ?? findings.length + 1}`,
      category: "asset",
      priority: asset.qualityGate === "exact" ? 88 : 74,
      source: filePath,
      target: String(asset.id ?? asset.assetPath ?? "asset"),
      reason: (asset.failures?.length ? asset.failures : [`asset status '${asset.status ?? "unknown"}' is not accepted`]).join("; "),
      evidence: {
        assetPath: asset.assetPath ?? null,
        metrics: asset.metrics ?? null,
      },
      suggestedAction: "Repair the crop/vector/alpha/export size first. Do not compensate for bad asset quality with CSS layout changes.",
    })
  }
}

function classifyText(value, fallback) {
  const text = String(value).toLowerCase()
  if (text.includes("overflow") || text.includes("overlap")) return "overflow"
  if (text.includes("font") || text.includes("text") || text.includes("title") || text.includes("price")) return "font"
  if (text.includes("asset") || text.includes("logo") || text.includes("icon") || text.includes("illustration")) return "asset"
  if (text.includes("color") || text.includes("shadow") || text.includes("background")) return "token"
  if (text.includes("position") || text.includes("size") || text.includes("layout")) return "layout"
  if (text.includes("spacing") || text.includes("padding") || text.includes("margin")) return "spacing"
  return fallback
}

function classifyElementFailure(message, target = "") {
  const text = String(message).toLowerCase()
  if (text.includes("overlap")) return "overflow"
  if (text.includes("overflow") && isTypographyTarget(target)) return "font"
  if (text.includes("overflow")) return "overflow"
  if (text.includes("font") || text.includes("line-height") || text.includes("font-size")) return "font"
  if (text.includes("position") || text.includes("size") || text.includes("selector")) return "layout"
  return classifyText(message, "layout")
}

function suggestedActionForRegion(target) {
  const category = classifyText(target, "layout")
  if (category === "asset") return "Open the region crop and asset contact sheet; fix crop, alpha, vector rebuild, or asset placement before editing layout."
  if (category === "font") return "Compare local screenshot and element manifest; tune font family, size, weight, line-height, and text box width."
  if (category === "token") return "Run theme calibration, compare sampled colors, and update theme tokens instead of one-off colors."
  return "Inspect the region crop, then adjust only the owning component's grid, dimensions, padding, or positioning."
}

function suggestedActionForElement(failure, target = "", category = classifyElementFailure(failure, target)) {
  if (category === "overflow") return "Increase the text slot, adjust wrapping rules, or declare a valid overlap group; rerun DOM audit."
  if (category === "font") return "Treat this as a typography calibration task: compare the local crop, self-host a closer official/open-source font if needed, tune font family, size, weight, line-height, and text slot width, then rerun DOM audit."
  return "Move or resize the mapped element to match element-manifest coordinates; avoid changing unrelated regions."
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

function formatRatio(value) {
  return Number.isFinite(value) ? value.toFixed(6) : "unknown"
}

function extractQuotedId(message) {
  const match = String(message).match(/'([^']+)'/)
  return match?.[1] ?? null
}

function groupBy(items, key) {
  return items.reduce((accumulator, item) => {
    const groupKey = item[key] ?? "other"
    accumulator[groupKey] ??= []
    accumulator[groupKey].push(item)
    return accumulator
  }, {})
}
