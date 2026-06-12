#!/usr/bin/env node
import path from "node:path"

import { parseArgs } from "./fidelity-lib.mjs"
import {
  ensureFoundation,
  foundationTemplateFromResult,
  readFoundationConfig,
  repoRoot,
  writeFoundationReport,
} from "./foundation-lib.mjs"

const args = parseArgs()
const config = await readFoundationConfig()
const result = await ensureFoundation(config, {
  foundation: args.foundation,
  update: !args["no-update"],
  clone: !args["no-clone"],
  allowBundledFallback: Boolean(args["allow-bundled-fallback"]),
})

const report = {
  tool: "sync-foundation",
  pass: true,
  foundation: {
    name: config.name,
    repository: config.repository,
    branch: config.branch,
    root: result.root,
    templateRoot: foundationTemplateFromResult(result, config),
    source: result.source,
    updated: result.updated,
    updateSkipped: result.updateSkipped ?? false,
    updateReason: result.updateReason ?? null,
    warning: result.warning ?? null,
  },
}

const reportPath = path.resolve(String(args.report ?? path.join(repoRoot, "tmp", "foundation-sync-report.json")))
await writeFoundationReport(reportPath, report)
console.log(JSON.stringify(report, null, 2))
