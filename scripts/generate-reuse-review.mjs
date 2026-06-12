#!/usr/bin/env node
import crypto from "node:crypto"
import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"

import { parseArgs, requireArg, writeJson } from "./fidelity-lib.mjs"
import {
  ensureFoundation,
  foundationTemplateFromResult,
  readFoundationConfig,
  repoRoot,
} from "./foundation-lib.mjs"

const args = parseArgs()
const projectRoot = path.resolve(requireArg(args, "project"))
const config = await readFoundationConfig()
const foundation = await ensureFoundation(config, {
  foundation: args.foundation,
  update: !args["no-update"],
  allowBundledFallback: true,
})
const foundationTemplateRoot = foundationTemplateFromResult(foundation, config)
const outPath = path.resolve(String(args.out ?? path.join(projectRoot, "tmp", "fidelity", "reuse-review.md")))
const jsonPath = path.resolve(String(args.json ?? path.join(projectRoot, "tmp", "fidelity", "reuse-review.json")))

const includeDirs = [
  "src/components/primitives",
  "src/components/layout",
  "src/components/fidelity",
  "src/theme",
  "src/lib",
  "scripts",
]
const projectSpecificDirs = ["src/pages", "src/data", "src/assets", "public"]
const candidates = []
const projectSpecific = []

for (const dir of includeDirs) {
  const absolute = path.join(projectRoot, dir)
  if (!existsSync(absolute)) {
    continue
  }
  for (const filePath of await listFiles(absolute)) {
    const relative = path.relative(projectRoot, filePath).replaceAll("\\", "/")
    const foundationPath = path.join(foundationTemplateRoot, relative)
    const status = !existsSync(foundationPath)
      ? "new"
      : (await hashFile(filePath)) === (await hashFile(foundationPath))
        ? "unchanged"
        : "changed"
    if (status === "unchanged") {
      continue
    }
    const text = await safeReadText(filePath)
    candidates.push({
      path: relative,
      status,
      recommendation: recommend(relative, text),
      risk: riskLevel(relative, text),
    })
  }
}

for (const dir of projectSpecificDirs) {
  const absolute = path.join(projectRoot, dir)
  if (!existsSync(absolute)) {
    continue
  }
  for (const filePath of await listFiles(absolute)) {
    projectSpecific.push(path.relative(projectRoot, filePath).replaceAll("\\", "/"))
  }
}

const report = {
  tool: "generate-reuse-review",
  pass: true,
  projectRoot,
  foundationRoot: foundation.root,
  foundationTemplateRoot,
  foundationSource: foundation.source,
  candidates,
  projectSpecific,
}

await writeJson(jsonPath, report)
await fs.mkdir(path.dirname(outPath), { recursive: true })
await fs.writeFile(outPath, renderMarkdown(report), "utf8")
console.log(JSON.stringify({ ...report, outPath, jsonPath }, null, 2))

async function listFiles(root) {
  const output = []
  const entries = await fs.readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    if (["node_modules", "dist", "tmp", ".git"].includes(entry.name)) {
      continue
    }
    const current = path.join(root, entry.name)
    if (entry.isDirectory()) {
      output.push(...(await listFiles(current)))
    } else {
      output.push(current)
    }
  }
  return output
}

async function hashFile(filePath) {
  const data = await fs.readFile(filePath)
  return crypto.createHash("sha256").update(data).digest("hex")
}

async function safeReadText(filePath) {
  try {
    return await fs.readFile(filePath, "utf8")
  } catch {
    return ""
  }
}

function recommend(relative, text) {
  if (/src\/theme\//.test(relative)) {
    return "review theme token changes; promote only if useful beyond this one screenshot"
  }
  if (/src\/components\/(primitives|layout|fidelity)\//.test(relative)) {
    return "promote candidate if API is generic, tokenized, and demo-covered"
  }
  if (/scripts\//.test(relative)) {
    return "promote only deterministic tooling that has a repeatable workflow"
  }
  if (/客户|项目|logo|brand|copyright|watermark/i.test(text)) {
    return "do not promote until project-specific text/assets are removed"
  }
  return "manual review required"
}

function riskLevel(relative, text) {
  if (/src\/assets\//.test(relative) || /base64|data:image|C:\\|D:\\|\/Users\//.test(text)) {
    return "high"
  }
  if (/#[0-9a-f]{3,8}|px|absolute/i.test(text)) {
    return "medium"
  }
  return "low"
}

function renderMarkdown(reportValue) {
  const lines = [
    "# Reuse Review",
    "",
    `Project: \`${reportValue.projectRoot}\``,
    `Foundation: \`${reportValue.foundationRoot}\` (${reportValue.foundationSource})`,
    "",
    "## Promote Candidates",
    "",
  ]

  if (reportValue.candidates.length === 0) {
    lines.push("No changed reusable foundation candidates were detected.")
  } else {
    for (const candidate of reportValue.candidates) {
      lines.push(`- \`${candidate.path}\` (${candidate.status}, risk: ${candidate.risk}) - ${candidate.recommendation}`)
    }
  }

  lines.push("", "## Project-Specific Files", "")
  if (reportValue.projectSpecific.length === 0) {
    lines.push("No project-specific files were detected in the default page/data/assets locations.")
  } else {
    for (const filePath of reportValue.projectSpecific.slice(0, 200)) {
      lines.push(`- \`${filePath}\``)
    }
    if (reportValue.projectSpecific.length > 200) {
      lines.push(`- ... ${reportValue.projectSpecific.length - 200} more`)
    }
  }

  lines.push(
    "",
    "## Promotion Rules",
    "",
    "- Promote only generic components, tokens, scripts, and examples.",
    "- Remove project-specific copy, logos, images, local paths, and one-off measurements first.",
    "- Open a focused PR against `moni-ui-foundation`; do not auto-merge learning from one task.",
  )

  return `${lines.join("\n")}\n`
}
