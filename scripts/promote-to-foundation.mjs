#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"

import { parseArgs, requireArg, writeJson } from "./fidelity-lib.mjs"
import {
  copyDirectory,
  ensureFoundation,
  foundationTemplateFromResult,
  readFoundationConfig,
} from "./foundation-lib.mjs"

const args = parseArgs()
const projectRoot = path.resolve(requireArg(args, "project"))
const paths = String(requireArg(args, "paths"))
  .split(",")
  .map((item) => item.trim().replaceAll("\\", "/"))
  .filter(Boolean)
const apply = Boolean(args.apply)
const config = await readFoundationConfig()
const foundation = await ensureFoundation(config, {
  foundation: args.foundation,
  update: false,
  allowBundledFallback: false,
})
const foundationTemplateRoot = foundationTemplateFromResult(foundation, config)
const promoted = []

for (const relative of paths) {
  if (relative.startsWith("../") || path.isAbsolute(relative)) {
    throw new Error(`Refusing unsafe relative path: ${relative}`)
  }
  const source = path.join(projectRoot, relative)
  const target = path.join(foundationTemplateRoot, relative)
  if (apply) {
    const stat = await fs.stat(source)
    if (stat.isDirectory()) {
      await copyDirectory(source, target)
    } else {
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.copyFile(source, target)
    }
  }
  promoted.push({ path: relative, source, target, applied: apply })
}

const report = {
  tool: "promote-to-foundation",
  pass: true,
  projectRoot,
  foundationRoot: foundation.root,
  foundationTemplateRoot,
  dryRun: !apply,
  promoted,
}

const reportPath = path.resolve(String(args.report ?? path.join(projectRoot, "tmp", "fidelity", "foundation-promotion-report.json")))
await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))
