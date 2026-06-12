#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { parseArgs, requireArg, writeJson } from "./fidelity-lib.mjs"
import {
  ensureFoundation,
  foundationTemplateFromResult,
  readFoundationConfig,
} from "./foundation-lib.mjs"

const args = parseArgs()
const targetRoot = path.resolve(requireArg(args, "target"))
const useFoundation = !args["no-foundation"] && !args.template
const foundationConfig = await readFoundationConfig()
const foundationResult = useFoundation
  ? await ensureFoundation(foundationConfig, {
      foundation: args.foundation,
      update: !args["no-update"],
      allowBundledFallback: true,
    })
  : null
const templateRoot = path.resolve(
  String(
    args.template ??
      (foundationResult
        ? foundationTemplateFromResult(foundationResult, foundationConfig)
        : "assets/templates/vite-react-shadcn"),
  ),
)
const force = Boolean(args.force)
const reportPath = path.resolve(String(args.report ?? path.join(targetRoot, "tmp", "scaffold-report.json")))
const ignoredTemplateEntries = new Set(["node_modules", "dist", "tmp", ".git"])

if (!(await exists(path.join(templateRoot, "package.json")))) {
  throw new Error(`Template root is missing package.json: ${templateRoot}`)
}

if (await exists(targetRoot)) {
  const entries = await fs.readdir(targetRoot)
  if (entries.length > 0 && !force) {
    throw new Error(`Target directory is not empty: ${targetRoot}. Pass --force to merge template files.`)
  }
}

await fs.mkdir(targetRoot, { recursive: true })
await copyDirectory(templateRoot, targetRoot)
const safetyOverlay = await ensureWindowsNodeTooling(targetRoot)

const report = {
  tool: "scaffold-react-project",
  pass: true,
  templateRoot,
  targetRoot,
  force,
  safetyOverlay,
  foundation: foundationResult
    ? {
        root: foundationResult.root,
        source: foundationResult.source,
        updated: foundationResult.updated,
        updateSkipped: foundationResult.updateSkipped ?? false,
        updateReason: foundationResult.updateReason ?? null,
        warning: foundationResult.warning ?? null,
      }
    : null,
}

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

async function copyDirectory(source, target) {
  await fs.mkdir(target, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })
  for (const entry of entries) {
    if (ignoredTemplateEntries.has(entry.name)) {
      continue
    }
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath)
    } else {
      await fs.copyFile(sourcePath, targetPath)
    }
  }
}

async function ensureWindowsNodeTooling(targetRoot) {
  const bundledTemplateRoot = path.resolve("assets/templates/vite-react-shadcn")
  const safetyFiles = [
    "validate.cmd",
    "dev.cmd",
    "scripts/check-frontend-architecture.mjs",
    "scripts/start-dev-server.cmd",
    "scripts/start-dev-server.mjs",
  ]
  const copied = []

  for (const relativePath of safetyFiles) {
    const sourcePath = path.join(bundledTemplateRoot, relativePath)
    const targetPath = path.join(targetRoot, relativePath)
    if (await exists(sourcePath)) {
      await fs.mkdir(path.dirname(targetPath), { recursive: true })
      await fs.copyFile(sourcePath, targetPath)
      copied.push(relativePath)
    }
  }

  const packagePath = path.join(targetRoot, "package.json")
  const packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"))
  packageJson.scripts ??= {}
  packageJson.scripts["dev:safe"] = "node scripts/start-dev-server.mjs"
  packageJson.scripts.validate = "npm run architecture:check && npm run typecheck && npm run build"
  await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8")

  return {
    copied,
    packageScripts: ["dev:safe", "validate"],
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
