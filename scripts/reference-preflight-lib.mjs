import sharp from "sharp"

export async function inspectReferenceImage(sourcePath, options = {}) {
  const redComponentMinArea = Number(options.redComponentMinArea ?? 140)
  const edgeWidth = Number(options.edgeWidth ?? 36)
  const source = sharp(sourcePath).ensureAlpha()
  const metadata = await source.metadata()
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true })
  const width = info.width
  const height = info.height
  const channels = info.channels
  const totalPixels = width * height

  const redMask = new Uint8Array(totalPixels)
  let redPixels = 0
  let mediumGrayPixels = 0
  let saturatedBottomRightPixels = 0
  let darkRightEdgePixels = 0
  const bottomStart = Math.floor(height * 0.78)
  const rightStart = Math.floor(width * 0.78)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x
      const offset = pixelIndex * channels
      const r = data[offset]
      const g = data[offset + 1]
      const b = data[offset + 2]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const saturation = max - min

      if (isAnnotationRed(r, g, b)) {
        redMask[pixelIndex] = 1
        redPixels += 1
      }

      if (isMediumGrayLowSaturation(r, g, b)) {
        mediumGrayPixels += 1
      }

      if (x >= rightStart && y >= bottomStart && saturation > 75 && max > 130) {
        saturatedBottomRightPixels += 1
      }

      if (x >= width - edgeWidth && isScrollbarLikePixel(r, g, b)) {
        darkRightEdgePixels += 1
      }
    }
  }

  const redComponents = findComponents(redMask, width, height, redComponentMinArea)
  const annotationCandidates = redComponents
    .map((component) => ({
      ...component,
      density: Number((component.area / (component.width * component.height)).toFixed(4)),
    }))
    .filter((component) => isLikelyAnnotation(component))
    .sort((a, b) => b.area - a.area)

  const rightEdgeRatio = darkRightEdgePixels / (edgeWidth * height)
  const mediumGrayRatio = mediumGrayPixels / totalPixels
  const saturatedBottomRightRatio = saturatedBottomRightPixels / ((width - rightStart) * (height - bottomStart))
  const failures = []
  const warnings = []

  if (annotationCandidates.length > 0) {
    failures.push("strong red annotation-like overlay detected; do not crop assets from this source")
  }
  if (rightEdgeRatio > 0.18) {
    failures.push("browser or app scrollbar-like edge detected; crop to the design canvas before asset extraction")
  }
  if (saturatedBottomRightRatio > 0.018) {
    failures.push("bottom-right floating widget or non-design overlay suspected")
  }
  if (mediumGrayRatio > 0.09) {
    warnings.push("repeated low-contrast gray overlay or watermark is suspected")
  }

  return {
    tool: "inspect-reference-image",
    sourcePath,
    pass: failures.length === 0,
    contaminated: failures.length > 0 || warnings.length > 0,
    sourceSize: {
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
    },
    stats: {
      redPixels,
      redPixelRatio: Number((redPixels / totalPixels).toFixed(6)),
      redComponents: redComponents.length,
      annotationCandidates: annotationCandidates.length,
      mediumGrayRatio: Number(mediumGrayRatio.toFixed(6)),
      rightEdgeScrollbarRatio: Number(rightEdgeRatio.toFixed(6)),
      saturatedBottomRightRatio: Number(saturatedBottomRightRatio.toFixed(6)),
    },
    annotationCandidates,
    failures,
    warnings,
  }
}

function isAnnotationRed(r, g, b) {
  return r > 210 && g < 120 && b < 120 && r - g > 80 && r - b > 80
}

function isMediumGrayLowSaturation(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min <= 18 && max >= 150 && max <= 228
}

function isScrollbarLikePixel(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min < 22 && max >= 90 && max <= 190
}

function findComponents(mask, width, height, minArea) {
  const visited = new Uint8Array(mask.length)
  const components = []
  const stack = []

  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index] || visited[index]) {
      continue
    }

    let area = 0
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    visited[index] = 1
    stack.push(index)

    while (stack.length > 0) {
      const current = stack.pop()
      const x = current % width
      const y = Math.floor(current / width)
      area += 1
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)

      pushNeighbor(current - 1, x > 0)
      pushNeighbor(current + 1, x < width - 1)
      pushNeighbor(current - width, y > 0)
      pushNeighbor(current + width, y < height - 1)
    }

    if (area >= minArea) {
      components.push({
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        area,
      })
    }
  }

  return components

  function pushNeighbor(next, allowed) {
    if (!allowed || visited[next] || !mask[next]) {
      return
    }
    visited[next] = 1
    stack.push(next)
  }
}

function isLikelyAnnotation(component) {
  const density = component.area / (component.width * component.height)
  const largeDiagonalStroke =
    component.area >= 220 &&
    component.width >= 34 &&
    component.height >= 34 &&
    density <= 0.36
  const longStroke =
    component.area >= 260 &&
    Math.max(component.width, component.height) >= 90 &&
    density <= 0.42
  return largeDiagonalStroke || longStroke
}
