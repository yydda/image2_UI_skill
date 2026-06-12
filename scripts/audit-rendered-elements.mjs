#!/usr/bin/env node
import { spawn } from "node:child_process"
import { createRequire } from "node:module"
import path from "node:path"
import sharp from "sharp"
import { ensureDir, parseArgs, readJson, requireArg, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const url = String(args.url ?? "")
const elementsPath = path.resolve(requireArg(args, "elements"))
const referencePath = args.reference ? path.resolve(String(args.reference)) : null
const outputDir = path.resolve(String(args["out-dir"] ?? "tmp/fidelity/element-audit"))
const widthArg = args.width ? Number(args.width) : null
const heightArg = args.height ? Number(args.height) : null
const deviceScaleFactor = Number(args["device-scale-factor"] ?? 1)
const waitMs = Number(args["wait-ms"] ?? 600)
const timeoutMs = Number(args.timeout ?? 30000)
const startCommand = args["start-command"] ? String(args["start-command"]) : null
const positionTolerance = Number(args["position-tolerance"] ?? 3)
const sizeTolerance = Number(args["size-tolerance"] ?? 3)
const fontSizeTolerance = Number(args["font-size-tolerance"] ?? 1.5)
const canvasSelectorArg = args["canvas-selector"] ? String(args["canvas-selector"]) : null

if (!url && !startCommand) {
  throw new Error("Provide --url, or provide --start-command plus --url")
}

await ensureDir(outputDir)

const manifest = await readJson(elementsPath)
const elements = normalizeElements(manifest)
const overlapGroups = Array.isArray(manifest.overlapGroups) ? manifest.overlapGroups : []
const canvasSelector = canvasSelectorArg ?? manifest.canvasSelector ?? null
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
  const browser = await playwright.chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor,
    reducedMotion: "reduce",
    colorScheme: "light",
  })
  const page = await context.newPage()
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

  const audit = await page.evaluate(
    ({ elements, canvasSelector, overlapGroups }) => {
      const canvas = canvasSelector ? document.querySelector(canvasSelector) : null
      const canvasRect = canvas?.getBoundingClientRect()
      const origin = canvasRect ? { x: canvasRect.left, y: canvasRect.top } : { x: 0, y: 0 }
      const inspected = []

      for (const element of elements) {
        const selector = element.selector
        const node = selector ? document.querySelector(selector) : null
        if (!selector || !node) {
          inspected.push({
            id: element.id,
            selector,
            found: false,
            expected: expectedBox(element),
          })
          continue
        }

        const rect = node.getBoundingClientRect()
        const style = getComputedStyle(node)
        const client = {
          width: node.clientWidth,
          height: node.clientHeight,
          scrollWidth: node.scrollWidth,
          scrollHeight: node.scrollHeight,
        }
        inspected.push({
          id: element.id,
          selector,
          found: true,
          type: element.type ?? "element",
          critical: Boolean(element.critical),
          expected: expectedBox(element),
          actual: {
            x: round(rect.left - origin.x),
            y: round(rect.top - origin.y),
            width: round(rect.width),
            height: round(rect.height),
          },
          text: node.textContent?.replace(/\s+/g, " ").trim() ?? "",
          client,
          overflow: client.scrollWidth > client.width + 1 || client.scrollHeight > client.height + 1,
          computedFont: {
            family: style.fontFamily,
            size: Number.parseFloat(style.fontSize),
            weight: style.fontWeight,
            lineHeight: style.lineHeight,
          },
        })
      }

      const byId = new Map(inspected.filter((item) => item.found).map((item) => [item.id, item]))
      const overlapResults = []
      for (const group of overlapGroups) {
        const ids = Array.isArray(group.elements) ? group.elements : []
        for (let outer = 0; outer < ids.length; outer += 1) {
          for (let inner = outer + 1; inner < ids.length; inner += 1) {
            const first = byId.get(ids[outer])
            const second = byId.get(ids[inner])
            if (!first || !second) {
              continue
            }
            const intersection = intersect(first.actual, second.actual)
            overlapResults.push({
              groupId: group.id,
              first: first.id,
              second: second.id,
              allowed: Boolean(group.allowOverlap),
              area: intersection.area,
              intersection,
            })
          }
        }
      }

      return {
        canvasSelector,
        canvasFound: !canvasSelector || Boolean(canvasRect),
        canvasRect: canvasRect
          ? {
              x: round(canvasRect.left),
              y: round(canvasRect.top),
              width: round(canvasRect.width),
              height: round(canvasRect.height),
            }
          : null,
        elements: inspected,
        overlapResults,
      }

      function expectedBox(element) {
        return {
          x: Number(element.x ?? element.left ?? 0),
          y: Number(element.y ?? element.top ?? 0),
          width: Number(element.width ?? element.w ?? 0),
          height: Number(element.height ?? element.h ?? 0),
        }
      }

      function intersect(first, second) {
        const left = Math.max(first.x, second.x)
        const top = Math.max(first.y, second.y)
        const right = Math.min(first.x + first.width, second.x + second.width)
        const bottom = Math.min(first.y + first.height, second.y + second.height)
        const width = Math.max(0, right - left)
        const height = Math.max(0, bottom - top)
        return { x: left, y: top, width, height, area: width * height }
      }

      function round(value) {
        return Number(Number(value).toFixed(3))
      }
    },
    { elements, canvasSelector, overlapGroups },
  )

  await context.close()
  await browser.close()

  const failures = []
  const warnings = []
  if (!audit.canvasFound) {
    failures.push(`canvas selector '${canvasSelector}' was not found`)
  }

  for (const item of audit.elements) {
    const source = elements.find((element) => String(element.id) === String(item.id)) ?? {}
    const boxTolerance = Number(source.tolerance ?? source.boxTolerance ?? positionTolerance)
    const currentSizeTolerance = Number(source.sizeTolerance ?? sizeTolerance)
    const currentFontSizeTolerance = Number(source.fontSizeTolerance ?? fontSizeTolerance)

    if (!item.found) {
      failures.push(`element '${item.id}' selector '${item.selector}' was not found`)
      continue
    }

    const positionDiff = {
      x: Math.abs(item.actual.x - item.expected.x),
      y: Math.abs(item.actual.y - item.expected.y),
      width: Math.abs(item.actual.width - item.expected.width),
      height: Math.abs(item.actual.height - item.expected.height),
    }
    item.positionDiff = positionDiff

    if (positionDiff.x > boxTolerance || positionDiff.y > boxTolerance) {
      failures.push(
        `element '${item.id}' position drift x=${positionDiff.x.toFixed(2)} y=${positionDiff.y.toFixed(2)} exceeds ${boxTolerance}`,
      )
    }
    if (positionDiff.width > currentSizeTolerance || positionDiff.height > currentSizeTolerance) {
      failures.push(
        `element '${item.id}' size drift width=${positionDiff.width.toFixed(2)} height=${positionDiff.height.toFixed(2)} exceeds ${currentSizeTolerance}`,
      )
    }

    if (item.overflow) {
      failures.push(`element '${item.id}' has text/content overflow`)
    }

    const expectedFont = source.font ?? {}
    const expectedFontSize = Number(expectedFont.size ?? expectedFont.fontSize)
    if (Number.isFinite(expectedFontSize)) {
      const fontDiff = Math.abs(item.computedFont.size - expectedFontSize)
      item.fontSizeDiff = Number(fontDiff.toFixed(3))
      if (fontDiff > currentFontSizeTolerance) {
        failures.push(
          `element '${item.id}' font-size ${item.computedFont.size}px differs from ${expectedFontSize}px by ${fontDiff.toFixed(2)}px`,
        )
      }
    }

    const expectedWeight = expectedFont.weight ?? expectedFont.fontWeight
    if (expectedWeight && normalizeWeight(item.computedFont.weight) !== normalizeWeight(expectedWeight)) {
      warnings.push(
        `element '${item.id}' font-weight '${item.computedFont.weight}' differs from expected '${expectedWeight}'`,
      )
    }
  }

  for (const overlap of audit.overlapResults) {
    if (!overlap.allowed && overlap.area > 1) {
      failures.push(
        `overlap group '${overlap.groupId}' has overlap between '${overlap.first}' and '${overlap.second}' area=${overlap.area.toFixed(2)}`,
      )
    }
  }

  const report = {
    tool: "audit-rendered-elements",
    pass: failures.length === 0,
    url,
    elementsPath,
    referencePath,
    outputDir,
    viewport,
    deviceScaleFactor,
    tolerances: {
      positionTolerance,
      sizeTolerance,
      fontSizeTolerance,
    },
    audit,
    failures,
    warnings,
  }

  await writeJson(path.join(outputDir, "element-audit-report.json"), report)
  console.log(JSON.stringify(report, null, 2))

  if (!report.pass && args["fail-on-error"]) {
    process.exitCode = 1
  }
} finally {
  if (serverProcess) {
    serverProcess.kill()
  }
}

function normalizeElements(manifest) {
  const candidates = [
    manifest?.elements,
    manifest?.items,
    Array.isArray(manifest) ? manifest : null,
  ].find((value) => Array.isArray(value))
  return candidates ?? []
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
    "Playwright is required for element auditing. On Windows install it in the target project with `cmd /c npm.cmd install -D playwright` and, if needed, `cmd /c npx.cmd playwright install chromium`.",
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

function normalizeWeight(value) {
  const text = String(value).trim().toLowerCase()
  if (text === "bold") {
    return "700"
  }
  if (text === "normal") {
    return "400"
  }
  return text
}
