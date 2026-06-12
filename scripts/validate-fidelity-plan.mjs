#!/usr/bin/env node
import path from "node:path"
import {
  field,
  parseArgs,
  parseBox,
  parseSize,
  parseStrategySequence,
  readJson,
  readManifest,
  requireArg,
  writeJson,
} from "./fidelity-lib.mjs"

const args = parseArgs()
const blueprintPath = path.resolve(requireArg(args, "blueprint"))
const layoutPath = path.resolve(requireArg(args, "layout"))
const assetsPath = path.resolve(requireArg(args, "assets"))
const interactionsPath = path.resolve(requireArg(args, "interactions"))
const elementsPath = args.elements ? path.resolve(String(args.elements)) : null
const iconsPath = args.icons ? path.resolve(String(args.icons)) : null
const previousAssetsPath = args["previous-assets"] ? path.resolve(String(args["previous-assets"])) : null
const reportPath = path.resolve(String(args.report ?? "tmp/fidelity/fidelity-plan-report.json"))
const mode = String(args.mode ?? "strict")
const failOnWarning = Boolean(args["fail-on-warning"])
const criticalMaxDiffRatio = Number(args["critical-max-diff-ratio"] ?? 0.06)

const blueprint = await readJson(blueprintPath)
const layout = await readJson(layoutPath)
const interactions = await readJson(interactionsPath)
const elements = elementsPath ? await readJson(elementsPath) : null
const icons = iconsPath ? await readJson(iconsPath) : null
const { manifest: assetManifest, assets } = await readManifest(assetsPath)
const previousAssets = previousAssetsPath ? await readPreviousAssets(previousAssetsPath) : new Map()

const failures = []
const warnings = []

const canvas = blueprint.canvas ?? {}
const canvasWidth = Number(canvas.width)
const canvasHeight = Number(canvas.height)
const fidelityMode = String(blueprint.fidelityMode ?? assetManifest.fidelityMode ?? "screenshot-exact")

if (!Number.isFinite(canvasWidth) || canvasWidth <= 0) {
  failures.push("page-blueprint.canvas.width must be a positive number")
}
if (!Number.isFinite(canvasHeight) || canvasHeight <= 0) {
  failures.push("page-blueprint.canvas.height must be a positive number")
}
if (canvas.deviceScaleFactor && Number(canvas.deviceScaleFactor) !== 1 && fidelityMode === "screenshot-exact") {
  warnings.push("screenshot-exact mode should capture at deviceScaleFactor 1")
}

const blueprintRegions = normalizeRegions(blueprint)
const layoutRegions = normalizeRegions(layout)
const interactionItems = normalizeInteractions(interactions, blueprint)

validateRegions(blueprintRegions, "page-blueprint.regions", failures, warnings, canvasWidth, canvasHeight)
validateRegions(layoutRegions, "layout-manifest.regions", failures, warnings, canvasWidth, canvasHeight)

if (mode === "strict") {
  if (!elementsPath) {
    failures.push("strict mode requires --elements tmp/fidelity/element-manifest.json")
  }
  if (!iconsPath) {
    failures.push("strict mode requires --icons tmp/fidelity/icon-inventory.json")
  }
  if (blueprintRegions.length < 3) {
    failures.push("strict mode requires at least three blueprint regions before implementation")
  }
  if (layoutRegions.length < 3) {
    failures.push("strict mode requires at least three layout regions before implementation")
  }
}

const layoutById = new Set(layoutRegions.map((region) => region.id))
for (const region of blueprintRegions.filter((item) => item.critical)) {
  if (!layoutById.has(region.id)) {
    warnings.push(`critical blueprint region '${region.id}' has no matching layout-manifest region`)
  }
}

for (const asset of assets) {
  validateAsset(asset, previousAssets.get(asset.id), fidelityMode, failures, warnings)
}

if (elements) {
  validateElements(elements, failures, warnings, canvasWidth, canvasHeight)
}

if (icons) {
  validateIcons(icons, assets, failures, warnings, canvasWidth, canvasHeight)
}

if (interactionItems.length === 0) {
  const reason = field(interactions, ["reason", "emptyReason"], null)
  if (mode === "strict" && !reason) {
    warnings.push("interaction-map has no interactions and no reason")
  }
}

const pass = failures.length === 0 && (!failOnWarning || warnings.length === 0)
const report = {
  tool: "validate-fidelity-plan",
  pass,
  mode,
  fidelityMode,
  blueprintPath,
  layoutPath,
  assetsPath,
  interactionsPath,
  elementsPath,
  iconsPath,
  previousAssetsPath,
  criticalMaxDiffRatio,
  counts: {
    blueprintRegions: blueprintRegions.length,
    layoutRegions: layoutRegions.length,
    assets: assets.length,
    interactions: interactionItems.length,
    elements: normalizeElements(elements).length,
    icons: normalizeIcons(icons).length,
  },
  failures,
  warnings,
}

await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

if (!pass && args["fail-on-error"]) {
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
        raw,
        id: String(raw.id ?? raw.name ?? `region-${index + 1}`),
        x: box?.x,
        y: box?.y,
        width: box?.width,
        height: box?.height,
        critical: Boolean(raw.critical),
        maxDiffRatio: raw.maxDiffRatio ?? raw["maxDiffRatio"] ?? null,
      }
    })
}

function normalizeInteractions(interactions, blueprint) {
  const candidates = [
    interactions?.interactions,
    interactions?.items,
    blueprint?.interactions,
  ].find((value) => Array.isArray(value))
  return candidates ?? []
}

function validateRegions(regions, label, failures, warnings, canvasWidth, canvasHeight) {
  if (!Array.isArray(regions) || regions.length === 0) {
    failures.push(`${label} must contain at least one region`)
    return
  }

  const seen = new Set()
  for (const region of regions) {
    if (!region.id || region.id === "undefined") {
      failures.push(`${label} contains a region without id`)
    } else if (seen.has(region.id)) {
      failures.push(`${label} contains duplicate region id '${region.id}'`)
    }
    seen.add(region.id)

    for (const key of ["x", "y", "width", "height"]) {
      if (!Number.isFinite(Number(region[key]))) {
        failures.push(`${label}.${region.id}.${key} must be a number`)
      }
    }

    if (Number(region.width) <= 0 || Number(region.height) <= 0) {
      failures.push(`${label}.${region.id} must have positive width and height`)
    }

    if (
      Number.isFinite(canvasWidth) &&
      Number.isFinite(canvasHeight) &&
      (Number(region.x) < 0 ||
        Number(region.y) < 0 ||
        Number(region.x) + Number(region.width) > canvasWidth ||
        Number(region.y) + Number(region.height) > canvasHeight)
    ) {
      warnings.push(`${label}.${region.id} extends outside the declared canvas`)
    }

    if (region.critical) {
      const configuredMax = Number(region.maxDiffRatio)
      if (Number.isFinite(configuredMax) && configuredMax > criticalMaxDiffRatio) {
        failures.push(
          `${label}.${region.id}.maxDiffRatio ${configuredMax} exceeds critical cap ${criticalMaxDiffRatio}`,
        )
      }
    }
  }
}

function normalizeElements(document) {
  if (!document) {
    return []
  }
  const candidates = [
    document?.elements,
    document?.items,
    Array.isArray(document) ? document : null,
  ].find((value) => Array.isArray(value))

  return candidates ?? []
}

function validateElements(document, failures, warnings, canvasWidth, canvasHeight) {
  const elements = normalizeElements(document)
  if (elements.length === 0) {
    failures.push("element-manifest must contain an elements array")
    return
  }

  const seen = new Set()
  for (const element of elements) {
    const id = String(element.id ?? "")
    if (!id) {
      failures.push("element-manifest contains an element without id")
      continue
    }
    if (seen.has(id)) {
      failures.push(`element-manifest contains duplicate element id '${id}'`)
    }
    seen.add(id)

    const box = parseBox(element)
    for (const key of ["x", "y", "width", "height"]) {
      if (!Number.isFinite(Number(box?.[key]))) {
        failures.push(`element '${id}' is missing numeric ${key}`)
      }
    }
    if (Number(box?.width) <= 0 || Number(box?.height) <= 0) {
      failures.push(`element '${id}' must have positive width and height`)
    }
    if (
      box &&
      Number.isFinite(canvasWidth) &&
      Number.isFinite(canvasHeight) &&
      (box.x < 0 || box.y < 0 || box.x + box.width > canvasWidth || box.y + box.height > canvasHeight)
    ) {
      warnings.push(`element '${id}' extends outside the declared canvas`)
    }

    const type = String(element.type ?? "element")
    const needsSelector = ["text", "button", "price", "status", "input", "link", "icon"].includes(type)
    if (needsSelector && !element.selector) {
      failures.push(`element '${id}' must include selector for DOM audit`)
    }

    if (["text", "button", "price", "status", "link"].includes(type)) {
      const font = element.font ?? {}
      if (!Number.isFinite(Number(font.size ?? font.fontSize))) {
        failures.push(`text element '${id}' must include font.size`)
      }
      if (!font.weight && !font.fontWeight) {
        failures.push(`text element '${id}' must include font.weight`)
      }
      if (!font.lineHeight) {
        warnings.push(`text element '${id}' should include font.lineHeight for font calibration`)
      }
    }
  }

  const overlapGroups = Array.isArray(document.overlapGroups) ? document.overlapGroups : []
  for (const group of overlapGroups) {
    if (!group.id) {
      failures.push("element-manifest overlapGroups entries must include id")
    }
    if (!Array.isArray(group.elements) || group.elements.length < 2) {
      failures.push(`overlap group '${group.id ?? "unknown"}' must list at least two element ids`)
    }
  }
}

function normalizeIcons(document) {
  if (!document) {
    return []
  }
  const candidates = [
    document?.icons,
    document?.items,
    Array.isArray(document) ? document : null,
  ].find((value) => Array.isArray(value))

  return candidates ?? []
}

function validateIcons(document, assets, failures, warnings, canvasWidth, canvasHeight) {
  const icons = normalizeIcons(document)
  if (icons.length === 0) {
    failures.push("icon-inventory must contain an icons array")
    return
  }

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
  const allowedExactStrategies = new Set(["original-crop", "repair-crop", "vector-rebuild", "manual-svg"])
  const seen = new Set()

  for (const icon of icons) {
    const id = String(icon.id ?? "")
    if (!id) {
      failures.push("icon-inventory contains an icon without id")
      continue
    }
    if (seen.has(id)) {
      failures.push(`icon-inventory contains duplicate icon id '${id}'`)
    }
    seen.add(id)

    const box = parseBox(icon)
    for (const key of ["x", "y", "width", "height"]) {
      if (!Number.isFinite(Number(box?.[key]))) {
        failures.push(`icon '${id}' is missing numeric ${key}`)
      }
    }
    if (Number(box?.width) <= 0 || Number(box?.height) <= 0) {
      failures.push(`icon '${id}' must have positive width and height`)
    }
    if (
      box &&
      Number.isFinite(canvasWidth) &&
      Number.isFinite(canvasHeight) &&
      (box.x < 0 || box.y < 0 || box.x + box.width > canvasWidth || box.y + box.height > canvasHeight)
    ) {
      warnings.push(`icon '${id}' extends outside the declared canvas`)
    }

    const generic = Boolean(icon.generic)
    const category = String(icon.category ?? icon.kind ?? "")
    const nonGeneric =
      !generic &&
      !["generic", "system", "standard-ui", "standard"].includes(category)
    const library = String(icon.library ?? icon.iconLibrary ?? "")

    if (!nonGeneric) {
      continue
    }

    const asset = icon.assetId ? assetsById.get(String(icon.assetId)) : null
    if (icon.assetId && !asset) {
      failures.push(`icon '${id}' references missing assetId '${icon.assetId}'`)
    }
    const strategy = String(icon.sourceStrategy ?? asset?.sourceStrategy ?? "")
    if (!allowedExactStrategies.has(strategy)) {
      failures.push(
        `non-generic icon '${id}' must use original-crop, repair-crop, vector-rebuild, or manual-svg`,
      )
    }
    if (library.toLowerCase().includes("lucide")) {
      failures.push(`non-generic icon '${id}' must not be replaced by lucide-react`)
    }
    if (!icon.assetId && !icon.targetPath && !["manual-svg", "vector-rebuild"].includes(strategy)) {
      failures.push(`non-generic icon '${id}' must reference assetId or targetPath`)
    }
  }
}

function validateAsset(asset, previousAsset, fidelityMode, failures, warnings) {
  if (asset.sourceStrategy === "code") {
    return
  }

  if (!asset.sourceStrategy) {
    failures.push(`asset '${asset.id}' is missing sourceStrategy`)
  }
  if (!asset.repairStrategy || asset.repairStrategy.length === 0) {
    failures.push(`asset '${asset.id}' is missing repairStrategy`)
  }
  if (!asset.qualityGate) {
    failures.push(`asset '${asset.id}' is missing qualityGate`)
  }
  if (!asset.targetPath) {
    failures.push(`asset '${asset.id}' is missing targetPath`)
  }

  if (asset.qualityGate === "exact" && asset.sourceStrategy === "image_gen-fallback") {
    failures.push(`exact asset '${asset.id}' must not use image_gen-fallback`)
  }

  const slotSize = parseSize(asset.raw.slotSize ?? asset.raw["slot size"])
  const targetPixels = parseSize(asset.raw.targetPixels ?? asset.raw["target pixels"])
  if (!slotSize) {
    failures.push(`asset '${asset.id}' is missing slotSize`)
  }
  if (!targetPixels) {
    failures.push(`asset '${asset.id}' is missing targetPixels`)
  }

  if (slotSize && targetPixels) {
    const below2x = targetPixels.width < Math.ceil(slotSize.width * 2) || targetPixels.height < Math.ceil(slotSize.height * 2)
    const allows1x = asset.raw.densityPolicy === "source-1x-accepted" && Boolean(asset.raw.downgradeReason)
    if (asset.qualityGate === "exact" && below2x && !allows1x) {
      failures.push(`exact asset '${asset.id}' targetPixels must be at least 2x slotSize`)
    } else if (below2x && fidelityMode !== "screenshot-exact") {
      warnings.push(`asset '${asset.id}' targetPixels is below 2x slotSize outside screenshot-exact mode`)
    }
  }

  const status = String(asset.raw.status ?? asset.status ?? "").toLowerCase()
  if (["needs-repair", "needs-review", "needs-regenerate", "rejected", "failed"].includes(status)) {
    const message = `asset '${asset.id}' status '${status}' must be accepted before final React integration`
    if (args["enforce-asset-acceptance"]) {
      failures.push(message)
    } else {
      warnings.push(message)
    }
  }

  if (previousAsset) {
    const downgrade = detectDowngrade(asset, previousAsset)
    if (downgrade.length > 0 && !asset.raw.downgradeReason) {
      failures.push(`asset '${asset.id}' was downgraded without downgradeReason: ${downgrade.join(", ")}`)
    }
  }
}

function detectDowngrade(asset, previousAsset) {
  const changes = []
  const previousStrategies = parseStrategySequence(previousAsset.repairStrategy ?? previousAsset["repair strategy"])
  const currentStrategies = asset.repairStrategy
  for (const strategy of ["upscale", "rembg-alpha", "flat-bg-alpha", "vectorize-svg", "manual-svg"]) {
    if (previousStrategies.includes(strategy) && !currentStrategies.includes(strategy)) {
      changes.push(`removed ${strategy}`)
    }
  }

  const previousTarget = parseSize(previousAsset.targetPixels ?? previousAsset["target pixels"])
  const currentTarget = asset.targetPixels
  if (previousTarget && currentTarget) {
    if (currentTarget.width < previousTarget.width || currentTarget.height < previousTarget.height) {
      changes.push(`targetPixels ${previousTarget.width}x${previousTarget.height} -> ${currentTarget.width}x${currentTarget.height}`)
    }
  }
  return changes
}

async function readPreviousAssets(filePath) {
  const previous = await readJson(filePath)
  const rawAssets = Array.isArray(previous.assets) ? previous.assets : Array.isArray(previous) ? previous : []
  return new Map(rawAssets.filter((asset) => asset.id).map((asset) => [String(asset.id), asset]))
}
