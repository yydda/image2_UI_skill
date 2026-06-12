#!/usr/bin/env node
import path from "node:path"
import { ensureDir, parseArgs, readJson, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const iteration = Number(args.iteration ?? 1)
const maxIterations = Number(args["max-iterations"] ?? 3)
const outputPath = path.resolve(String(args.out ?? "tmp/fidelity/fidelity-loop-state.json"))
const queuePath = args.queue ? path.resolve(String(args.queue)) : null
const diagnosisPath = args.diagnosis ? path.resolve(String(args.diagnosis)) : null

const queue = queuePath ? await readOptionalJson(queuePath) : null
const diagnosis = diagnosisPath ? await readOptionalJson(diagnosisPath) : null
const tasks = normalizeTasks(queue, diagnosis)
const pass = tasks.length === 0
const canContinue = !pass && iteration < maxIterations
const focus = tasks.slice(0, Number(args["focus-count"] ?? 5))

const report = {
  tool: "run-fidelity-loop",
  pass,
  iteration,
  maxIterations,
  canContinue,
  queuePath,
  diagnosisPath,
  focus,
  nextCommands: buildNextCommands(args),
  agentInstructions: pass
    ? ["All supplied gates passed. Do not keep polishing without a new failing report."]
    : [
        "Fix only the listed focus items before touching unrelated regions.",
        "Prefer asset repair for asset failures, token calibration for color/typography failures, and local component layout edits for box drift.",
        "Capture a new screenshot after fixes, rerun page diff, region diff, DOM audit, asset score, diagnosis, repair queue, and this loop state.",
        canContinue
          ? `Continue to iteration ${iteration + 1} after fixes.`
          : "Stop claiming strict 1:1; report loose gate passed only or 未达 1:1 with the remaining focus items.",
      ],
}

await ensureDir(path.dirname(outputPath))
await writeJson(outputPath, report)
console.log(JSON.stringify(report, null, 2))

if (!report.pass && args["fail-on-open-loop"]) {
  process.exitCode = 1
}

async function readOptionalJson(filePath) {
  try {
    return await readJson(filePath)
  } catch {
    return null
  }
}

function normalizeTasks(queue, diagnosis) {
  if (Array.isArray(queue?.tasks)) {
    return queue.tasks.map((task) => ({
      id: String(task.id ?? task.target ?? "task"),
      category: task.category ?? "unknown",
      priority: Number(task.priority ?? 50),
      target: String(task.target ?? task.id ?? "unknown"),
      reason: task.reason ?? "queued repair",
      nextAction: task.nextAction ?? task.suggestedAction ?? "Repair and rerun fidelity gates.",
    }))
  }
  if (Array.isArray(diagnosis?.findings)) {
    return diagnosis.findings.map((finding) => ({
      id: String(finding.id ?? finding.target ?? "finding"),
      category: finding.category ?? "unknown",
      priority: Number(finding.priority ?? 50),
      target: String(finding.target ?? finding.id ?? "unknown"),
      reason: finding.reason ?? "diagnosed mismatch",
      nextAction: finding.suggestedAction ?? "Repair and rerun fidelity gates.",
    }))
  }
  return []
}

function buildNextCommands(args) {
  const commands = []
  if (args["page-report"] || args["region-report"] || args["element-report"] || args["asset-report"]) {
    commands.push("node scripts/diagnose-fidelity-diff.mjs --page-report <page> --region-report <regions> --element-report <elements> --asset-report <assets>")
    commands.push("node scripts/build-repair-queue.mjs --page-report <page> --region-report <regions> --element-report <elements> --asset-report <assets>")
  }
  commands.push("node scripts/run-fidelity-loop.mjs --queue tmp/fidelity/repair-queue.json --diagnosis tmp/fidelity/diff-diagnosis.json")
  return commands
}
