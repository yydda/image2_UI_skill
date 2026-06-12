#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { ensureDir, parseArgs, readJson, requireArg, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const referencePath = path.resolve(requireArg(args, "reference"))
const elementsPath = args.elements ? path.resolve(String(args.elements)) : null
const cssPath = path.resolve(String(args.out ?? "tmp/fidelity/theme-calibration.css"))
const reportPath = path.resolve(String(args.report ?? "tmp/fidelity/theme-calibration.json"))
const sampleSize = Number(args["sample-size"] ?? 96)

const metadata = await sharp(referencePath).metadata()
const { data, info } = await sharp(referencePath)
  .resize(sampleSize, sampleSize, { fit: "inside" })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const colors = collectColors(data, info)
const edges = collectEdgeColors(data, info)
const dominant = colors.slice(0, 8)
const background = averageColor(edges.length ? edges : dominant)
const dark = nearestByLuminance(colors, 0.12) ?? { r: 24, g: 24, b: 24 }
const muted = nearestByLuminance(colors, 0.44) ?? { r: 104, g: 104, b: 104 }
const border = nearestByLuminance(colors, 0.82) ?? background
const brand = mostSaturated(colors) ?? dark
const typography = elementsPath ? await inferTypography(elementsPath) : {}

const tokens = {
  background: toHslToken(background),
  foreground: toHslToken(dark),
  card: toHslToken(lighten(background, 0.035)),
  "card-foreground": toHslToken(dark),
  primary: toHslToken(brand),
  "primary-foreground": toHslToken(contrastText(brand)),
  secondary: toHslToken(lighten(background, 0.06)),
  "secondary-foreground": toHslToken(dark),
  muted: toHslToken(lighten(background, 0.075)),
  "muted-foreground": toHslToken(muted),
  accent: toHslToken(lighten(brand, 0.42)),
  "accent-foreground": toHslToken(darken(brand, 0.22)),
  border: toHslToken(border),
  input: toHslToken(border),
  ring: toHslToken(brand),
  brand: toHslToken(brand),
  "brand-foreground": toHslToken(contrastText(brand)),
  "brand-muted": toHslToken(lighten(brand, 0.46)),
  surface: toHslToken(background),
  "surface-raised": toHslToken(lighten(background, 0.035)),
  "surface-subtle": toHslToken(lighten(background, 0.065)),
}

const report = {
  tool: "calibrate-theme",
  referencePath,
  elementsPath,
  referenceSize: { width: metadata.width, height: metadata.height },
  sampledColors: dominant.map((color) => ({ ...color, hsl: toHslToken(color), hex: toHex(color) })),
  selected: {
    background: { ...background, hsl: tokens.background, hex: toHex(background) },
    foreground: { ...dark, hsl: tokens.foreground, hex: toHex(dark) },
    muted: { ...muted, hsl: tokens["muted-foreground"], hex: toHex(muted) },
    border: { ...border, hsl: tokens.border, hex: toHex(border) },
    brand: { ...brand, hsl: tokens.brand, hex: toHex(brand) },
  },
  typography,
  cssPath,
}

await ensureDir(path.dirname(cssPath))
await fs.writeFile(cssPath, renderCss(tokens, typography), "utf8")
await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

function collectColors(buffer, imageInfo) {
  const bins = new Map()
  for (let offset = 0; offset < buffer.length; offset += imageInfo.channels) {
    const alpha = buffer[offset + 3]
    if (alpha < 200) continue
    const r = buffer[offset]
    const g = buffer[offset + 1]
    const b = buffer[offset + 2]
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`
    const entry = bins.get(key) ?? { r: 0, g: 0, b: 0, count: 0 }
    entry.r += r
    entry.g += g
    entry.b += b
    entry.count += 1
    bins.set(key, entry)
  }
  return [...bins.values()]
    .map((entry) => {
      const color = {
        r: Math.round(entry.r / entry.count),
        g: Math.round(entry.g / entry.count),
        b: Math.round(entry.b / entry.count),
        count: entry.count,
      }
      return {
        ...color,
        luminance: luminance(color),
        saturation: rgbToHsl(color).s,
      }
    })
    .sort((a, b) => b.count - a.count)
}

function collectEdgeColors(buffer, imageInfo) {
  const edge = []
  for (let y = 0; y < imageInfo.height; y += 1) {
    for (let x = 0; x < imageInfo.width; x += 1) {
      if (x > 2 && y > 2 && x < imageInfo.width - 3 && y < imageInfo.height - 3) continue
      const offset = (y * imageInfo.width + x) * imageInfo.channels
      if (buffer[offset + 3] < 200) continue
      edge.push({ r: buffer[offset], g: buffer[offset + 1], b: buffer[offset + 2], count: 1 })
    }
  }
  return edge
}

async function inferTypography(filePath) {
  const manifest = await readJson(filePath)
  const elements = manifest.elements ?? manifest.items ?? []
  const sizes = elements
    .map((element) => Number(element.font?.size ?? element.fontSize ?? element.font?.fontSize))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  const weights = elements
    .map((element) => String(element.font?.weight ?? element.fontWeight ?? ""))
    .filter(Boolean)
  return {
    sizes,
    weights: [...new Set(weights)],
    suggestedScale: sizes.length
      ? {
          small: percentile(sizes, 0.2),
          body: percentile(sizes, 0.5),
          title: percentile(sizes, 0.85),
        }
      : null,
  }
}

function renderCss(tokens, typography) {
  const tokenLines = Object.entries(tokens).map(([name, value]) => `    --${name}: ${value};`)
  const typeComment = typography.suggestedScale
    ? `\n    /* inferred type scale: small ${typography.suggestedScale.small}px, body ${typography.suggestedScale.body}px, title ${typography.suggestedScale.title}px */`
    : ""
  return `@layer base {
  [data-theme="calibrated-reference"] {${typeComment}
${tokenLines.join("\n")}
  }
}
`
}

function averageColor(colors) {
  const total = colors.reduce(
    (accumulator, color) => ({
      r: accumulator.r + color.r * (color.count ?? 1),
      g: accumulator.g + color.g * (color.count ?? 1),
      b: accumulator.b + color.b * (color.count ?? 1),
      count: accumulator.count + (color.count ?? 1),
    }),
    { r: 0, g: 0, b: 0, count: 0 },
  )
  return {
    r: Math.round(total.r / total.count),
    g: Math.round(total.g / total.count),
    b: Math.round(total.b / total.count),
  }
}

function nearestByLuminance(colors, target) {
  return colors
    .filter((color) => color.count > 2)
    .sort((a, b) => Math.abs(luminance(a) - target) - Math.abs(luminance(b) - target))[0]
}

function mostSaturated(colors) {
  return colors
    .filter((color) => color.count > 2 && luminance(color) > 0.15 && luminance(color) < 0.75)
    .sort((a, b) => rgbToHsl(b).s - rgbToHsl(a).s)[0]
}

function lighten(color, amount) {
  const hsl = rgbToHsl(color)
  return hslToRgb({ h: hsl.h, s: hsl.s, l: Math.min(0.98, hsl.l + amount) })
}

function darken(color, amount) {
  const hsl = rgbToHsl(color)
  return hslToRgb({ h: hsl.h, s: hsl.s, l: Math.max(0.08, hsl.l - amount) })
}

function contrastText(color) {
  return luminance(color) > 0.55 ? { r: 28, g: 24, b: 20 } : { r: 255, g: 255, b: 255 }
}

function toHslToken(color) {
  const hsl = rgbToHsl(color)
  return `${Math.round(hsl.h)} ${Math.round(hsl.s * 100)}% ${Math.round(hsl.l * 100)}%`
}

function toHex(color) {
  return `#${[color.r, color.g, color.b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`
}

function luminance(color) {
  const [r, g, b] = [color.r, color.g, color.b].map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function rgbToHsl(color) {
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    if (max === g) h = (b - r) / d + 2
    if (max === b) h = (r - g) / d + 4
    h *= 60
  }
  return { h, s, l }
}

function hslToRgb(hsl) {
  const c = (1 - Math.abs(2 * hsl.l - 1)) * hsl.s
  const x = c * (1 - Math.abs(((hsl.h / 60) % 2) - 1))
  const m = hsl.l - c / 2
  const [r, g, b] =
    hsl.h < 60 ? [c, x, 0] :
    hsl.h < 120 ? [x, c, 0] :
    hsl.h < 180 ? [0, c, x] :
    hsl.h < 240 ? [0, x, c] :
    hsl.h < 300 ? [x, 0, c] :
    [c, 0, x]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function percentile(values, p) {
  const index = Math.min(values.length - 1, Math.max(0, Math.round((values.length - 1) * p)))
  return values[index]
}
