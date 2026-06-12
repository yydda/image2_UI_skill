#!/usr/bin/env node
import { spawn } from "node:child_process"
import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

const args = parseArgs()
const projectRoot = path.resolve(String(args.project ?? "."))
const force = Boolean(args.force)
const cacheDir = path.join(projectRoot, "node_modules", ".moni-cache")
const cacheFile = path.join(cacheDir, "deps.hash")
const reportPath = path.resolve(String(args.report ?? path.join(projectRoot, "tmp", "deps-report.json")))
const packagePath = path.join(projectRoot, "package.json")
const lockPath = path.join(projectRoot, "package-lock.json")
const nodeModulesPath = path.join(projectRoot, "node_modules")
const packageHash = await hashFiles([packagePath, lockPath])
const previousHash = await readText(cacheFile)
const nodeModulesExists = await exists(nodeModulesPath)
const skip = !force && nodeModulesExists && previousHash === packageHash

if (!skip) {
  const command = (await exists(lockPath))
    ? ["npm", ["ci", "--prefer-offline", "--no-audit", "--fund=false"]]
    : ["npm", ["install", "--no-audit", "--fund=false"]]
  await run(command[0], command[1], projectRoot)
  await ensureDir(cacheDir)
  await fs.writeFile(cacheFile, packageHash, "utf8")
}

const report = {
  tool: "ensure-project-deps",
  projectRoot,
  skipped: skip,
  reason: skip ? "node_modules exists and package/lock hash is unchanged" : "dependencies installed or refreshed",
  packageHash,
}
await writeJson(reportPath, report)
console.log(JSON.stringify(report, null, 2))

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

async function hashFiles(files) {
  const hash = crypto.createHash("sha256")
  for (const file of files) {
    if (await exists(file)) {
      hash.update(path.basename(file))
      hash.update(await fs.readFile(file))
    }
  }
  return hash.digest("hex")
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

async function exists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, "utf8")
  } catch {
    return null
  }
}

function run(command, commandArgs, cwd) {
  return new Promise((resolve, reject) => {
    const executable = process.platform === "win32" ? "cmd.exe" : command
    const args = process.platform === "win32"
      ? ["/d", "/s", "/c", [command, ...commandArgs].join(" ")]
      : commandArgs
    const child = spawn(executable, args, {
      cwd,
      stdio: "inherit",
    })
    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${commandArgs.join(" ")} exited with code ${code}`))
      }
    })
    child.on("error", reject)
  })
}
