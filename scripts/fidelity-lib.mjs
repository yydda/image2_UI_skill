import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (!item.startsWith("--")) {
      continue
    }

    const rawKey = item.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) {
      args[rawKey] = true
      continue
    }

    args[rawKey] = next
    index += 1
  }

  return args
}

export function requireArg(args, name) {
  const value = args[name]
  if (!value || value === true) {
    throw new Error(`Missing required argument: --${name}`)
  }
  return String(value)
}

export function resolvePath(baseDir, maybePath) {
  if (!maybePath) {
    return null
  }
  return path.isAbsolute(maybePath) ? maybePath : path.resolve(baseDir, maybePath)
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

export async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

export async function readJson(filePath) {
  return JSON.parse(stripBom(await fs.readFile(filePath, "utf8")))
}

export function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

export async function copyFileSafe(source, target) {
  await ensureDir(path.dirname(target))
  await fs.copyFile(source, target)
}

export function field(object, names, fallback = undefined) {
  for (const name of names) {
    if (object && Object.prototype.hasOwnProperty.call(object, name)) {
      return object[name]
    }
  }
  return fallback
}

export function parseBox(value) {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    const [x, y, width, height] = value.split(/[,\sx]+/).filter(Boolean).map(Number)
    return { x, y, width, height }
  }

  const x = Number(value.x ?? value.left ?? 0)
  const y = Number(value.y ?? value.top ?? 0)
  const width = Number(value.width ?? value.w)
  const height = Number(value.height ?? value.h)
  return { x, y, width, height }
}

export function parseSize(value) {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    const [width, height] = value.split(/[,\sx]+/).filter(Boolean).map(Number)
    return { width, height }
  }

  return {
    width: Number(value.width ?? value.w),
    height: Number(value.height ?? value.h),
  }
}

export function parseStrategySequence(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }

  if (!value) {
    return ["none"]
  }

  return String(value)
    .split(/[,|+]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeAsset(rawAsset) {
  const slotSize = parseSize(field(rawAsset, ["slotSize", "slot size", "CSS 槽位尺寸"]))
  const targetPixels =
    parseSize(field(rawAsset, ["targetPixels", "target pixels", "导出尺寸"])) ??
    (slotSize
      ? {
          width: Math.ceil(slotSize.width * 2),
          height: Math.ceil(slotSize.height * 2),
        }
      : null)

  return {
    raw: rawAsset,
    id: String(field(rawAsset, ["id", "asset id", "assetId"])),
    type: field(rawAsset, ["type", "类型"], "asset"),
    uiPosition: field(rawAsset, ["uiPosition", "UI 位置", "ui position"], ""),
    sourceStrategy: field(
      rawAsset,
      ["sourceStrategy", "source strategy", "代码或 image_gen"],
      "code",
    ),
    repairStrategy: parseStrategySequence(field(rawAsset, ["repairStrategy", "repair strategy"], "none")),
    transparentRequired: Boolean(
      field(rawAsset, ["transparentRequired", "transparent required", "是否透明"], false),
    ),
    backgroundMatched: Boolean(field(rawAsset, ["backgroundMatched", "background matched"], false)),
    backgroundColor: field(rawAsset, ["backgroundColor", "background color"], null),
    cropBox: parseBox(field(rawAsset, ["cropBox", "crop box"])),
    padding: Number(field(rawAsset, ["padding", "cropPadding", "crop padding"], 0)),
    slotSize,
    targetPixels,
    qualityGate: field(rawAsset, ["qualityGate", "quality gate"], "close"),
    status: field(rawAsset, ["status"], "needs-repair"),
    targetPath: field(rawAsset, ["targetPath", "target path", "目标路径"], null),
    inputPath: field(rawAsset, ["inputPath", "input path", "sourcePath", "source path"], null),
    extractedPath: field(rawAsset, ["extractedPath", "extracted path"], null),
    repairedPath: field(rawAsset, ["repairedPath", "repaired path"], null),
    prompt: field(rawAsset, ["prompt", "source prompt"], ""),
    rejectIf: field(rawAsset, ["rejectIf", "reject if"], null),
  }
}

export async function readManifest(manifestPath) {
  const manifest = await readJson(manifestPath)
  const assets = Array.isArray(manifest.assets)
    ? manifest.assets.map(normalizeAsset)
    : Array.isArray(manifest)
      ? manifest.map(normalizeAsset)
      : []

  if (assets.length === 0) {
    throw new Error("Manifest must contain an assets array")
  }

  for (const asset of assets) {
    if (!asset.id || asset.id === "undefined") {
      throw new Error("Every asset must have an id")
    }
  }

  return { manifest, assets, manifestDir: path.dirname(path.resolve(manifestPath)) }
}

export function assetRasterExtension(asset) {
  if (asset.sourceStrategy === "vector-rebuild" || asset.repairStrategy.includes("vectorize-svg")) {
    return ".svg"
  }
  return ".png"
}

export function inferExtractedPath(asset, outDir) {
  return path.join(outDir, `${asset.id}-crop.png`)
}

export function inferRepairedPath(asset, outDir) {
  return path.join(outDir, `${asset.id}${assetRasterExtension(asset)}`)
}

export function findExistingPath(candidates) {
  return candidates.find((candidate) => candidate && existsSync(candidate)) ?? null
}
