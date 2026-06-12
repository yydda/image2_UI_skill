#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { ensureDir, parseArgs, requireArg, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const url = String(args.url ?? "")
const referencePath = args.reference ? path.resolve(String(args.reference)) : null
const outputDir = path.resolve(String(args["out-dir"] ?? "tmp/fidelity/capture"))
const screenshotPath = path.resolve(String(args.output ?? path.join(outputDir, "page.png")))
const widthArg = args.width ? Number(args.width) : null
const heightArg = args.height ? Number(args.height) : null
const deviceScaleFactor = Number(args["device-scale-factor"] ?? 1)
const waitMs = Number(args["wait-ms"] ?? 600)
const timeoutMs = Number(args.timeout ?? 30000)
const startCommand = args["start-command"] ? String(args["start-command"]) : null
const compare = Boolean(args.compare)
const regionsPath = args.regions ? path.resolve(String(args.regions)) : null
const elementsPath = args.elements ? path.resolve(String(args.elements)) : null
const assertNoFractionalScaleSelector = args["assert-no-fractional-scale-selector"]
  ? String(args["assert-no-fractional-scale-selector"])
  : null

if (!url && !startCommand) {
  throw new Error("Provide --url, or provide --start-command plus --url")
}

await ensureDir(outputDir)
await ensureDir(path.dirname(screenshotPath))

const playwright = loadPlaywright()
let serverProcess = null

try {
  if (startCommand) {
    serverProcess = spawn(startCommand, {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      cwd: process.cwd(),
    })
    serverProcess.stdout.on("data", (chunk) => process.stdout.write(chunk))
    serverProcess.stderr.on("data", (chunk) => process.stderr.write(chunk))
  }

  if (url) {
    await waitForUrl(url, timeoutMs)
  }

  const viewport = await resolveViewport(referencePath, widthArg, heightArg)
  const browser = await playwright.chromium.launch({
    headless: true,
  })
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor,
    reducedMotion: "reduce",
    colorScheme: "light",
  })
  const page = await context.newPage()
  await page.addInitScript(() => {
    window.__MONI_FIDELITY_CAPTURE__ = true
  })
  await page.goto(url, { waitUntil: "load", timeout: timeoutMs })
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready
    }
  })
  await page.waitForTimeout(waitMs)

  const scaleInspection = assertNoFractionalScaleSelector
    ? await inspectScale(page, assertNoFractionalScaleSelector)
    : null

  await page.screenshot({ path: screenshotPath, fullPage: false })
  await context.close()
  await browser.close()

  const report = {
    tool: "capture-fidelity",
    pass: !scaleInspection?.fractionalScale,
    url,
    referencePath,
    screenshotPath,
    outputDir,
    viewport,
    deviceScaleFactor,
    waitMs,
    scaleInspection,
    compareReports: [],
    failures: [
      ...(scaleInspection?.fractionalScale
        ? [`fractional scale detected on selector '${assertNoFractionalScaleSelector}'`]
        : []),
    ],
  }

  if (compare && referencePath) {
    const compareReport = runNodeScript("compare-fidelity.mjs", [
      "--reference",
      referencePath,
      "--actual",
      screenshotPath,
      "--out-dir",
      path.join(outputDir, "page-diff"),
      "--allow-size-mismatch",
    ])
    report.compareReports.push(compareReport)

    if (regionsPath) {
      const regionReport = runNodeScript("compare-region-fidelity.mjs", [
        "--reference",
        referencePath,
        "--actual",
        screenshotPath,
        "--regions",
        regionsPath,
        "--out-dir",
        path.join(outputDir, "region-diff"),
      ])
      report.compareReports.push(regionReport)
    }

    if (elementsPath) {
      const elementReport = runNodeScript("audit-rendered-elements.mjs", [
        "--url",
        url,
        "--elements",
        elementsPath,
        "--reference",
        referencePath,
        "--out-dir",
        path.join(outputDir, "element-audit"),
      ])
      report.compareReports.push(elementReport)
    }
  }

  const failedCompareReports = report.compareReports.filter((item) => item.ok === false || item.reportPass === false)
  if (failedCompareReports.length > 0) {
    report.failures.push(
      ...failedCompareReports.map((item) => `${item.script} reported failed fidelity gate`),
    )
    report.pass = false
  }

  await writeJson(path.join(outputDir, "capture-fidelity-report.json"), report)
  console.log(JSON.stringify(report, null, 2))

  if (!report.pass && args["fail-on-error"]) {
    process.exitCode = 1
  }
} finally {
  if (serverProcess) {
    serverProcess.kill()
  }
}

function loadPlaywright() {
  const projectRequire = createRequire(path.join(process.cwd(), "package.json"))
  for (const packageName of ["playwright", "playwright-core"]) {
    try {
      return projectRequire(packageName)
    } catch {
      // Try the next package name.
    }
  }

  throw new Error(
    "Playwright is required for deterministic capture. On Windows install it in the target project with `cmd /c npm.cmd install -D playwright` and, if needed, `cmd /c npx.cmd playwright install chromium`.",
  )
}

async function resolveViewport(referencePath, widthArg, heightArg) {
  if (widthArg && heightArg) {
    return { width: widthArg, height: heightArg }
  }

  if (!referencePath) {
    throw new Error("Provide --width and --height when --reference is not supplied")
  }

  const meta = await sharp(referencePath).metadata()
  return {
    width: widthArg ?? meta.width,
    height: heightArg ?? meta.height,
  }
}

async function waitForUrl(targetUrl, timeoutMs) {
  const started = Date.now()
  let lastError = null

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(targetUrl, { method: "GET" })
      if (response.ok || response.status < 500) {
        return
      }
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Timed out waiting for ${targetUrl}: ${lastError?.message ?? "no response"}`)
}

async function inspectScale(page, selector) {
  return page.evaluate((targetSelector) => {
    const element = document.querySelector(targetSelector)
    if (!element) {
      return { selector: targetSelector, found: false, fractionalScale: false }
    }

    const style = getComputedStyle(element)
    const transform = style.transform
    let scaleX = 1
    let scaleY = 1
    if (transform && transform !== "none") {
      const values = transform.match(/matrix\(([^)]+)\)/)?.[1]?.split(",").map((value) => Number(value.trim()))
      if (values?.length >= 4) {
        scaleX = values[0]
        scaleY = values[3]
      }
    }

    const fractionalScale =
      Math.abs(scaleX - Math.round(scaleX)) > 0.001 ||
      Math.abs(scaleY - Math.round(scaleY)) > 0.001

    return {
      selector: targetSelector,
      found: true,
      transform,
      scaleX,
      scaleY,
      fractionalScale,
    }
  }, selector)
}

function runNodeScript(scriptName, scriptArgs) {
  const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), scriptName)
  const run = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
  })

  if (run.stdout) {
    process.stdout.write(run.stdout)
  }
  if (run.stderr) {
    process.stderr.write(run.stderr)
  }

  const parsedReport = parseLastJsonObject(String(run.stdout ?? ""))

  return {
    script: scriptName,
    status: run.status,
    ok: run.status === 0,
    reportPass: typeof parsedReport?.pass === "boolean" ? parsedReport.pass : null,
    stdout: String(run.stdout ?? "").slice(0, 2000),
    stderr: String(run.stderr ?? "").slice(0, 2000),
  }
}

function parseLastJsonObject(output) {
  const start = output.lastIndexOf("{")
  if (start < 0) {
    return null
  }

  for (let index = start; index >= 0; index = output.lastIndexOf("{", index - 1)) {
    try {
      return JSON.parse(output.slice(index))
    } catch {
      // Keep scanning backward to find the start of the printed report.
    }
  }
  return null
}
