#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"

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
  "src/theme/tokens.css",
  "src/theme/typography.css",
  "src/theme/themes/default.css",
  "src/theme/themes/warm-finance.css",
  "src/theme/themes/mobile-ios.css",
  "src/assets/generated",
  "src/assets/original",
  "src/assets/repaired",
  "src/data",
  "src/lib/utils.ts",
  "src/lib/asset-registry.ts",
  "src/types/fidelity.ts",
  "src/types/page.ts",
]

const failures = []
const warnings = []

for (const relativePath of requiredPaths) {
  if (!(await exists(path.join(projectRoot, relativePath)))) {
    failures.push(`missing required architecture path: ${relativePath}`)
  }
}

const packagePath = path.join(projectRoot, "package.json")
if (await exists(packagePath)) {
  const packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"))
  for (const scriptName of ["typecheck", "build", "architecture:check", "deps:ensure"]) {
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
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
console.log(JSON.stringify(report, null, 2))

if (!report.pass && args["fail-on-error"]) {
  process.exitCode = 1
}

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (!item.startsWith("--")) continue
    const key = item.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) {
      parsed[key] = true
    } else {
      parsed[key] = next
      index += 1
    }
  }
  return parsed
}

async function checkAlias() {
  const viteConfig = (await readTextIfExists(path.join(projectRoot, "vite.config.ts"))) ?? ""
  if (!viteConfig.includes('"@"') && !viteConfig.includes("'@'")) {
    failures.push("vite.config.ts must define @ alias to src")
  }

  const tsconfigText = (await readTextIfExists(path.join(projectRoot, "tsconfig.json"))) ?? ""
  const tsconfigAppText = (await readTextIfExists(path.join(projectRoot, "tsconfig.app.json"))) ?? ""
  if (!`${tsconfigText}\n${tsconfigAppText}`.includes('"@/*"')) {
    failures.push("TypeScript config must define @/* path alias")
  }
}

async function checkSourceText() {
  if (await exists(path.join(projectRoot, "src/components/app"))) {
    failures.push("forbidden legacy architecture path exists: src/components/app")
  }

  const sourceFiles = await listFiles(path.join(projectRoot, "src"))
  const windowsAbsolutePath = /[A-Za-z]:[\\/][^\s"'`)]+/
  const fileUrl = /file:\/\//i
  for (const filePath of sourceFiles) {
    if (!/\.(ts|tsx|css|json|html)$/.test(filePath)) continue
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
  if (!(await exists(root))) return []
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
