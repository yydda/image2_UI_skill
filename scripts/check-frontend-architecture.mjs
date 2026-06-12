#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { parseArgs, readJson, writeJson } from "./fidelity-lib.mjs"

const args = parseArgs()
const projectRoot = path.resolve(String(args.project ?? args.cwd ?? "."))
const reportPath = args.report
  ? path.resolve(String(args.report))
  : path.join(projectRoot, "tmp", "architecture-report.json")

const requiredPaths = [
  "package.json",
  "tsconfig.json",
  "tsconfig.app.json",
  "vite.config.ts",
  "tailwind.config.ts",
  "components.json",
  "scripts/ensure-project-deps.mjs",
  "src/app/AppShell.tsx",
  "src/app/routes.tsx",
  "src/pages",
  "src/components/ui",
  "src/components/primitives",
  "src/components/layout",
  "src/components/fidelity",
  "src/theme/font-faces.css",
  "src/theme/tokens.css",
  "src/theme/typography.css",
  "src/theme/themes/default.css",
  "src/theme/themes/warm-finance.css",
  "src/theme/themes/mobile-ios.css",
  "src/assets/generated",
  "src/assets/original",
  "src/assets/repaired",
  "src/assets/fonts",
  "src/data",
  "src/lib/utils.ts",
  "src/lib/asset-registry.ts",
  "src/types/fidelity.ts",
  "src/types/page.ts",
]

const requiredScripts = ["typecheck", "build", "architecture:check", "deps:ensure"]
const failures = []
const warnings = []

for (const relativePath of requiredPaths) {
  if (!(await exists(path.join(projectRoot, relativePath)))) {
    failures.push(`missing required architecture path: ${relativePath}`)
  }
}

const packagePath = path.join(projectRoot, "package.json")
if (await exists(packagePath)) {
  const packageJson = await readJson(packagePath)
  for (const scriptName of requiredScripts) {
    if (!packageJson.scripts?.[scriptName]) {
      failures.push(`package.json is missing script '${scriptName}'`)
    }
  }
}

await checkAlias()
await checkSourceText()

const report = {
  tool: "check-frontend-architecture",
  pass: failures.length === 0,
  projectRoot,
  requiredPaths,
  failures,
  warnings,
}

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

if (!report.pass && args["fail-on-error"]) {
  process.exitCode = 1
}

async function checkAlias() {
  const viteConfigPath = path.join(projectRoot, "vite.config.ts")
  const tsconfigPath = path.join(projectRoot, "tsconfig.json")
  const tsconfigAppPath = path.join(projectRoot, "tsconfig.app.json")

  const viteConfig = (await readTextIfExists(viteConfigPath)) ?? ""
  if (!viteConfig.includes('"@"') && !viteConfig.includes("'@'")) {
    failures.push("vite.config.ts must define @ alias to src")
  }

  const tsconfigText = (await readTextIfExists(tsconfigPath)) ?? ""
  const tsconfigAppText = (await readTextIfExists(tsconfigAppPath)) ?? ""
  const combined = `${tsconfigText}\n${tsconfigAppText}`
  if (!combined.includes('"@/*"')) {
    failures.push("TypeScript config must define @/* path alias")
  }
}

async function checkSourceText() {
  const sourceFiles = await listFiles(path.join(projectRoot, "src"))
  const windowsAbsolutePath = /[A-Za-z]:[\\/][^\s"'`)]+/
  const fileUrl = /file:\/\//i
  const forbiddenSourceDirs = [
    "src/components/app",
  ]

  for (const forbiddenDir of forbiddenSourceDirs) {
    if (await exists(path.join(projectRoot, forbiddenDir))) {
      failures.push(`forbidden legacy architecture path exists: ${forbiddenDir}`)
    }
  }

  for (const filePath of sourceFiles) {
    if (!/\.(ts|tsx|css|json|html)$/.test(filePath)) {
      continue
    }
    const text = await fs.readFile(filePath, "utf8")
    if (windowsAbsolutePath.test(text) || fileUrl.test(text)) {
      failures.push(`source file contains a local absolute path: ${path.relative(projectRoot, filePath)}`)
    }
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readTextIfExists(filePath) {
  return (await exists(filePath)) ? fs.readFile(filePath, "utf8") : null
}

async function listFiles(root) {
  if (!(await exists(root))) {
    return []
  }
  const entries = await fs.readdir(root, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)))
    } else {
      files.push(fullPath)
    }
  }
  return files
}
