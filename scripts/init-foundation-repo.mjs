#!/usr/bin/env node
import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"

import { parseArgs } from "./fidelity-lib.mjs"
import {
  copyDirectory,
  getFoundationPaths,
  readFoundationConfig,
  repoRoot,
  writeFoundationReport,
} from "./foundation-lib.mjs"

const args = parseArgs()
const config = await readFoundationConfig()
const paths = getFoundationPaths(config)
const targetRoot = path.resolve(String(args.target ?? paths.localRoot))
const templateTarget = path.join(targetRoot, config.templatePath)
const force = Boolean(args.force)

await fs.mkdir(targetRoot, { recursive: true })
if (!existsSync(path.join(templateTarget, "package.json")) || force) {
  await copyDirectory(paths.bundledTemplateRoot, templateTarget)
}
await writeText(path.join(targetRoot, "README.md"), foundationReadme(config))
await writeText(path.join(targetRoot, "FOUNDATION.md"), foundationGuide())
await writeText(path.join(targetRoot, "docs", "governance.md"), governanceDoc())
await writeText(path.join(targetRoot, "examples", ".gitkeep"), "")
await writeText(path.join(targetRoot, "packages", ".gitkeep"), "")
await writeText(path.join(targetRoot, "foundation.manifest.json"), `${JSON.stringify(manifest(config), null, 2)}\n`)
await writeText(path.join(targetRoot, "package.json"), `${JSON.stringify(packageJson(), null, 2)}\n`)
await writeText(path.join(targetRoot, ".gitignore"), "node_modules/\ndist/\ntmp/\n.DS_Store\n")

const report = {
  tool: "init-foundation-repo",
  pass: true,
  targetRoot,
  templateTarget,
  force,
}

const reportPath = path.resolve(String(args.report ?? path.join(repoRoot, "tmp", "foundation-init-report.json")))
await writeFoundationReport(reportPath, report)
console.log(JSON.stringify(report, null, 2))

async function writeText(filePath, text) {
  if (!force) {
    try {
      await fs.access(filePath)
      return
    } catch {
      // continue
    }
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, text, "utf8")
}

function foundationReadme(configValue) {
  return `# Moni UI Foundation

Shared frontend foundation for Moni UI screenshot-to-code work.

This repository stores the reusable engineering base used by \`moni-ui-skill\`:

- Vite + React + TypeScript + shadcn template
- CSS tokens and theme presets
- shared primitives, layout components, and fidelity helpers
- architecture checks and dependency cache scripts
- examples and reusable promotion candidates

Default template:

\`\`\`text
${configValue.templatePath}/
\`\`\`

Use from the skill repository:

\`\`\`powershell
node scripts/sync-foundation.mjs
node scripts/scaffold-react-project.mjs --target <project>
node scripts/generate-reuse-review.mjs --project <project>
\`\`\`
`
}

function foundationGuide() {
  return `# Foundation Contract

The foundation is the long-term memory for reusable UI engineering work.

Promote code only when it is reusable across multiple pages, does not contain project-specific copy or brand assets, exposes a stable API, uses tokens instead of one-off values, and passes typecheck/build/architecture checks.

Do not promote one-off pages, generated screenshots, customer logos, paid or private assets, local absolute paths, or quick fixes that only satisfy one reference image.
`
}

function governanceDoc() {
  return `# Governance

## Start Of Task

1. Pull the latest foundation.
2. Scaffold from the foundation template.
3. Keep project-specific work in pages, data, and assets.
4. Use primitives and tokens before creating one-off code.

## End Of Task

1. Run validation.
2. Generate a reuse review.
3. Promote only reviewed reusable candidates.
4. Open a focused PR against this repository for foundation changes.
`
}

function manifest(configValue) {
  return {
    name: configValue.name,
    version: "0.1.0",
    templatePath: configValue.templatePath,
    promotionPolicy: "review-required",
    promotedBy: "moni-ui-skill",
  }
}

function packageJson() {
  return {
    name: "moni-ui-foundation",
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: {
      "template:architecture": "node templates/vite-react-shadcn/scripts/check-frontend-architecture.mjs --project templates/vite-react-shadcn --fail-on-error",
      "template:deps": "cd templates/vite-react-shadcn && npm run deps:ensure",
      "template:typecheck": "cd templates/vite-react-shadcn && npm run typecheck",
      "template:build": "cd templates/vite-react-shadcn && npm run build"
    }
  }
}
