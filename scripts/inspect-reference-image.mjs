#!/usr/bin/env node
import path from "node:path"
import { ensureDir, parseArgs, requireArg, writeJson } from "./fidelity-lib.mjs"
import { inspectReferenceImage } from "./reference-preflight-lib.mjs"

const args = parseArgs()
const sourcePath = path.resolve(requireArg(args, "source"))
const outputDir = path.resolve(String(args["out-dir"] ?? "tmp/fidelity/reference-preflight"))
const reportPath = path.resolve(String(args.report ?? path.join(outputDir, "reference-preflight-report.json")))

await ensureDir(outputDir)

const report = await inspectReferenceImage(sourcePath, {
  redComponentMinArea: args["red-component-min-area"],
  edgeWidth: args["edge-width"],
})

await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

if (!report.pass && args["fail-on-contamination"]) {
  process.exitCode = 1
}
