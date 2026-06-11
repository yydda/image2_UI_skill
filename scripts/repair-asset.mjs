#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import {
  copyFileSafe,
  ensureDir,
  findExistingPath,
  inferExtractedPath,
  inferRepairedPath,
  parseArgs,
  readJson,
  readManifest,
  requireArg,
  resolvePath,
  writeJson,
} from "./fidelity-lib.mjs"

const args = parseArgs()
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const skillRoot = path.dirname(scriptDir)
const require = createRequire(import.meta.url)
const fidelityConfig = await loadFidelityConfig()
const manifestPath = path.resolve(requireArg(args, "manifest"))
const inputDir = path.resolve(String(args["input-dir"] ?? "src/assets/original/extracted"))
const outputDir = path.resolve(String(args["out-dir"] ?? "src/assets/original/repaired"))
const outDirProvided = Object.prototype.hasOwnProperty.call(args, "out-dir")
const workDir = path.join(outputDir, ".work")
const reportPath = path.resolve(String(args.report ?? path.join(outputDir, "repair-report.json")))
const extractionReportPath = args["extraction-report"]
  ? path.resolve(String(args["extraction-report"]))
  : path.join(inputDir, "extraction-report.json")

const extractionReport = await readOptionalJson(extractionReportPath)
const extractedById = new Map(
  (extractionReport?.assets ?? [])
    .filter((entry) => entry.id && entry.outputPath)
    .map((entry) => [entry.id, entry.outputPath]),
)
const { assets } = await readManifest(manifestPath)
const results = []

await ensureDir(outputDir)
await ensureDir(workDir)

for (const asset of assets) {
  const sourcePath = findExistingPath([
    resolvePath(process.cwd(), asset.inputPath),
    resolvePath(process.cwd(), asset.extractedPath),
    extractedById.get(asset.id),
    inferExtractedPath(asset, inputDir),
  ])

  if (!sourcePath) {
    results.push({
      id: asset.id,
      ok: false,
      status: "rejected",
      reason: "no extracted/input asset found",
    })
    continue
  }

  const finalPath =
    resolvePath(process.cwd(), asset.repairedPath) ??
    (!outDirProvided ? resolvePath(process.cwd(), asset.targetPath) : null) ??
    inferRepairedPath(asset, outputDir)

  let currentPath = sourcePath
  const operations = []

  for (const strategy of asset.repairStrategy) {
    const nextPath = path.join(workDir, `${asset.id}-${operations.length + 1}-${strategy}.png`)
    const svgPath = path.join(workDir, `${asset.id}-${operations.length + 1}-${strategy}.svg`)

    if (strategy === "none" || strategy === "background-matched") {
      operations.push(await resizeOrCopy(currentPath, nextPath, asset, strategy))
      currentPath = nextPath
      continue
    }

    if (strategy === "flat-bg-alpha") {
      operations.push(await flatBackgroundToAlpha(currentPath, nextPath, Number(args.tolerance ?? 18)))
      currentPath = nextPath
      continue
    }

    if (strategy === "rembg-alpha") {
      const result = await runRembg(currentPath, nextPath, Number(args.tolerance ?? 18))
      operations.push(result)
      currentPath = nextPath
      continue
    }

    if (strategy === "upscale") {
      const result = await runUpscale(currentPath, nextPath, asset)
      operations.push(result)
      currentPath = nextPath
      continue
    }

    if (strategy === "vectorize-svg" || strategy === "manual-svg") {
      const result = await runVectorize(currentPath, svgPath, strategy)
      operations.push(result)
      currentPath = svgPath
      break
    }

    operations.push({
      strategy,
      ok: false,
      fallback: true,
      detail: `Unknown repair strategy: ${strategy}`,
    })
  }

  if (operations.length === 0) {
    const nextPath = path.join(workDir, `${asset.id}-copy.png`)
    operations.push(await resizeOrCopy(currentPath, nextPath, asset, "none"))
    currentPath = nextPath
  }

  await ensureDir(path.dirname(finalPath))
  await copyFileSafe(currentPath, finalPath)

  results.push({
    id: asset.id,
    ok: true,
    status: "accepted-for-scoring",
    sourcePath,
    outputPath: finalPath,
    sourceStrategy: asset.sourceStrategy,
    repairStrategy: asset.repairStrategy,
    operations,
  })
}

const report = {
  tool: "repair-asset",
  manifestPath,
  inputDir,
  outputDir,
  assets: results,
}

await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

async function readOptionalJson(filePath) {
  try {
    return await readJson(filePath)
  } catch {
    return null
  }
}

async function resizeOrCopy(inputPath, outputPath, asset, strategy) {
  const image = sharp(inputPath)
  const target = asset.targetPixels

  await ensureDir(path.dirname(outputPath))
  if (target?.width && target?.height) {
    await image
      .resize(target.width, target.height, {
        fit: "inside",
        withoutEnlargement: false,
        kernel: "lanczos3",
      })
      .sharpen()
      .png()
      .toFile(outputPath)
  } else {
    await image.png().toFile(outputPath)
  }

  return { strategy, ok: true, outputPath }
}

async function flatBackgroundToAlpha(inputPath, outputPath, tolerance) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const key = sampleCornerColor(data, info.width, info.height)
  let transparentPixels = 0

  for (let offset = 0; offset < data.length; offset += 4) {
    const distance = Math.sqrt(
      (data[offset] - key.r) ** 2 +
        (data[offset + 1] - key.g) ** 2 +
        (data[offset + 2] - key.b) ** 2,
    )

    if (distance <= tolerance) {
      data[offset + 3] = 0
      transparentPixels += 1
    }
  }

  await sharp(data, { raw: info }).png().toFile(outputPath)
  return {
    strategy: "flat-bg-alpha",
    ok: true,
    outputPath,
    sampledBackground: key,
    transparentPixels,
  }
}

async function runRembg(inputPath, outputPath, tolerance) {
  const rembgCommand = fidelityConfig.rembgCommand || (commandExists("rembg") ? "rembg" : null)
  let externalFailure = null

  if (rembgCommand) {
    const run = spawnSync(rembgCommand, ["i", inputPath, outputPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })

    if (run.status === 0) {
      return {
        strategy: "rembg-alpha",
        ok: true,
        outputPath,
        externalTool: "rembg",
      }
    }

    externalFailure = describeSpawnFailure(run, rembgCommand)
  }

  if (fidelityConfig.pythonPath && fidelityConfig.rembgMode === "python-module") {
    const pythonDir = path.dirname(fidelityConfig.pythonPath)
    const pythonRembg = findExistingPath([
      path.join(pythonDir, "Scripts", "rembg.exe"),
      path.join(path.dirname(pythonDir), "Scripts", "rembg.exe"),
    ])
    const run = pythonRembg
      ? spawnSync(pythonRembg, ["i", inputPath, outputPath], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        })
      : spawnSync(fidelityConfig.pythonPath, ["-m", "rembg.cli", "i", inputPath, outputPath], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        })

    if (run.status === 0) {
      return {
        strategy: "rembg-alpha",
        ok: true,
        outputPath,
        externalTool: "python -m rembg",
      }
    }

    externalFailure =
      describeSpawnFailure(run, pythonRembg ?? `${fidelityConfig.pythonPath} -m rembg.cli`) ?? externalFailure
  }

  const fallback = await flatBackgroundToAlpha(inputPath, outputPath, tolerance)
  return {
    ...fallback,
    strategy: "rembg-alpha",
    fallback: "flat-bg-alpha",
    detail: externalFailure
      ? `rembg command failed; used flat-bg-alpha fallback. ${externalFailure}`
      : "rembg command not available; used flat-bg-alpha fallback.",
  }
}

async function runUpscale(inputPath, outputPath, asset) {
  const inputMeta = await sharp(inputPath).metadata()
  const scale = selectUpscaleScale(inputMeta, asset)
  const command =
    fidelityConfig.realesrganPath || findCommand(["realesrgan-ncnn-vulkan", "realesrgan-ncnn-vulkan.exe"])
  let externalFailure = null

  if (command) {
    const rawOutputPath = needsTargetResize(asset)
      ? path.join(path.dirname(outputPath), `${path.basename(outputPath, path.extname(outputPath))}-raw.png`)
      : outputPath
    const run = spawnSync(command, ["-i", inputPath, "-o", rawOutputPath, "-s", String(scale)], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      cwd: path.isAbsolute(command) ? path.dirname(command) : undefined,
    })

    if (run.status === 0) {
      await resizeToTargetIfNeeded(rawOutputPath, outputPath, asset)
      return {
        strategy: "upscale",
        ok: true,
        outputPath,
        externalTool: "realesrgan-ncnn-vulkan",
        scale,
      }
    }

    externalFailure = describeSpawnFailure(run, command)
  }

  const width = asset.targetPixels?.width ?? Math.max(inputMeta.width * scale, inputMeta.width)
  const height = asset.targetPixels?.height ?? Math.max(inputMeta.height * scale, inputMeta.height)
  await sharp(inputPath)
    .resize(width, height, {
      fit: asset.targetPixels?.width && asset.targetPixels?.height ? "fill" : "inside",
      withoutEnlargement: false,
      kernel: "lanczos3",
    })
    .sharpen()
    .png()
    .toFile(outputPath)

  return {
    strategy: "upscale",
    ok: true,
    outputPath,
    fallback: "sharp-resize",
    detail: externalFailure
      ? `realesrgan-ncnn-vulkan failed; used sharp-resize fallback. ${externalFailure}`
      : "realesrgan-ncnn-vulkan command not available; used sharp-resize fallback.",
  }
}

function selectUpscaleScale(inputMeta, asset) {
  const requestedScale = Number(asset.raw.scale ?? 0)
  const requiredScale = Math.max(
    asset.targetPixels?.width ? asset.targetPixels.width / inputMeta.width : 1,
    asset.targetPixels?.height ? asset.targetPixels.height / inputMeta.height : 1,
    2,
  )
  const minimumScale = Math.max(requestedScale || 2, requiredScale)
  return [2, 3, 4].find((scale) => scale >= minimumScale) ?? 4
}

function needsTargetResize(asset) {
  return Boolean(asset.targetPixels?.width && asset.targetPixels?.height)
}

async function resizeToTargetIfNeeded(inputPath, outputPath, asset) {
  if (!needsTargetResize(asset)) {
    if (inputPath !== outputPath) {
      await copyFileSafe(inputPath, outputPath)
    }
    return
  }

  await sharp(inputPath)
    .resize(asset.targetPixels.width, asset.targetPixels.height, {
      fit: "fill",
      kernel: "lanczos3",
    })
    .sharpen()
    .png()
    .toFile(outputPath)
}

async function runVectorize(inputPath, outputPath, strategy) {
  const vtracerCommand = fidelityConfig.vtracerCommand || (commandExists("vtracer") ? "vtracer" : null)
  if (strategy === "vectorize-svg" && vtracerCommand) {
    const run = spawnSync(vtracerCommand, ["--input", inputPath, "--output", outputPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })

    if (run.status === 0) {
      return {
        strategy,
        ok: true,
        outputPath,
        externalTool: "vtracer",
      }
    }
  }

  if (strategy === "vectorize-svg") {
    const result = await runPotrace(inputPath, outputPath)
    if (result.ok) {
      return result
    }
  }

  const image = await fs.readFile(inputPath)
  const encoded = image.toString("base64")
  const meta = await sharp(inputPath).metadata()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}" viewBox="0 0 ${meta.width} ${meta.height}"><image href="data:image/png;base64,${encoded}" width="${meta.width}" height="${meta.height}"/></svg>`
  await ensureDir(path.dirname(outputPath))
  await fs.writeFile(outputPath, svg, "utf8")

  return {
    strategy,
    ok: true,
    outputPath,
    fallback: "embedded-raster-svg",
    detail: "vtracer command not available or manual SVG path not supplied",
  }
}

async function runPotrace(inputPath, outputPath) {
  try {
    const potrace = require("potrace")
    const svg = await new Promise((resolve, reject) => {
      potrace.trace(
        inputPath,
        {
          background: potrace.Potrace.COLOR_TRANSPARENT,
          threshold: potrace.Potrace.THRESHOLD_AUTO,
          turdSize: 2,
          optCurve: true,
          optTolerance: 0.2,
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        },
      )
    })

    await ensureDir(path.dirname(outputPath))
    await fs.writeFile(outputPath, svg, "utf8")
    return {
      strategy: "vectorize-svg",
      ok: true,
      outputPath,
      externalTool: "potrace",
    }
  } catch (error) {
    return {
      strategy: "vectorize-svg",
      ok: false,
      detail: `potrace fallback failed: ${error.message}`,
    }
  }
}

async function loadFidelityConfig() {
  for (const configPath of [
    path.join(process.cwd(), ".fidelity-tools", "config.json"),
    path.join(skillRoot, ".fidelity-tools", "config.json"),
  ]) {
    try {
      return await readJson(configPath)
    } catch {
      // Try the next config path.
    }
  }
  return {}
}

function describeSpawnFailure(run, command) {
  if (!run) {
    return null
  }

  const chunks = [`command=${command}`]
  if (run.error) {
    chunks.push(`error=${run.error.message}`)
  }
  if (run.status !== null && run.status !== undefined) {
    chunks.push(`status=${run.status}`)
  }
  const stderr = String(run.stderr ?? "").trim()
  const stdout = String(run.stdout ?? "").trim()
  if (stderr) {
    chunks.push(`stderr=${stderr.slice(0, 600)}`)
  }
  if (stdout) {
    chunks.push(`stdout=${stdout.slice(0, 300)}`)
  }
  return chunks.join("; ")
}

function commandExists(command) {
  return Boolean(findCommand([command]))
}

function findCommand(candidates) {
  for (const command of candidates) {
    try {
      const result = execFileSync(process.platform === "win32" ? "where.exe" : "which", [command], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
      const first = result.split(/\r?\n/).find(Boolean)
      if (first) {
        return first
      }
    } catch {
      // Keep trying candidates.
    }
  }
  return null
}

function sampleCornerColor(data, width, height) {
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]

  const total = points.reduce(
    (sum, [x, y]) => {
      const offset = (y * width + x) * 4
      return {
        r: sum.r + data[offset],
        g: sum.g + data[offset + 1],
        b: sum.b + data[offset + 2],
      }
    },
    { r: 0, g: 0, b: 0 },
  )

  return {
    r: Math.round(total.r / points.length),
    g: Math.round(total.g / points.length),
    b: Math.round(total.b / points.length),
  }
}
