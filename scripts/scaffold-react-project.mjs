#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { parseArgs, requireArg, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const targetRoot = path.resolve(requireArg(args, "target"))
const templateRoot = path.resolve(String(args.template ?? "assets/templates/vite-react-shadcn"))
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

const report = {
  tool: "scaffold-react-project",
  pass: true,
  templateRoot,
  targetRoot,
  force,
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

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
