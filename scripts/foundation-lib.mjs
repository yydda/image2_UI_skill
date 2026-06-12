import { spawnSync } from "node:child_process"
import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { readJson, writeJson } from "./fidelity-lib.mjs"

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export async function readFoundationConfig(configPath = path.join(repoRoot, "foundation.config.json")) {
  if (!existsSync(configPath)) {
    return defaultConfig()
  }

  return {
    ...defaultConfig(),
    ...(await readJson(configPath)),
  }
}

export function defaultConfig() {
  return {
    name: "moni-ui-foundation",
    repository: "https://github.com/yydda/moni-ui-foundation.git",
    branch: "main",
    localPath: "../moni-ui-foundation",
    cachePath: ".moni-foundation-cache/moni-ui-foundation",
    templatePath: "templates/vite-react-shadcn",
    bundledTemplatePath: "assets/templates/vite-react-shadcn",
  }
}

export function resolveFromRoot(value) {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value)
}

export function getFoundationPaths(config) {
  return {
    localRoot: resolveFromRoot(config.localPath),
    cacheRoot: resolveFromRoot(config.cachePath),
    bundledTemplateRoot: resolveFromRoot(config.bundledTemplatePath),
  }
}

export function getTemplateRoot(foundationRoot, config) {
  return path.join(foundationRoot, config.templatePath)
}

export async function hasFoundationTemplate(foundationRoot, config) {
  return existsSync(path.join(getTemplateRoot(foundationRoot, config), "package.json"))
}

export async function findFoundationRoot(config, explicitRoot = null) {
  const paths = getFoundationPaths(config)
  const candidates = [explicitRoot, paths.localRoot, paths.cacheRoot].filter(Boolean)
  for (const candidate of candidates) {
    const absolute = path.resolve(candidate)
    if (await hasFoundationTemplate(absolute, config)) {
      return absolute
    }
  }
  return null
}

export async function ensureFoundation(config, options = {}) {
  const explicitRoot = options.foundation ? path.resolve(options.foundation) : null
  if (explicitRoot) {
    if (!(await hasFoundationTemplate(explicitRoot, config))) {
      throw new Error(`Foundation root is missing ${config.templatePath}/package.json: ${explicitRoot}`)
    }
    return { root: explicitRoot, source: "explicit", updated: false }
  }

  const paths = getFoundationPaths(config)
  if (await hasFoundationTemplate(paths.localRoot, config)) {
    const update = options.update !== false ? tryUpdateGitRepo(paths.localRoot, config.branch) : skipped("update disabled")
    return { root: paths.localRoot, source: "local", ...update }
  }

  if (await hasFoundationTemplate(paths.cacheRoot, config)) {
    const update = options.update !== false ? tryUpdateGitRepo(paths.cacheRoot, config.branch) : skipped("update disabled")
    return { root: paths.cacheRoot, source: "cache", ...update }
  }

  if (options.clone === false || !config.repository) {
    if (options.allowBundledFallback) {
      return { root: paths.bundledTemplateRoot, templateRoot: paths.bundledTemplateRoot, source: "bundled", updated: false }
    }
    throw new Error("Foundation repository is not available and clone is disabled")
  }

  await fs.mkdir(path.dirname(paths.cacheRoot), { recursive: true })
  const clone = run("git", ["clone", "--depth", "1", "--branch", config.branch, config.repository, paths.cacheRoot], {
    cwd: repoRoot,
    throwOnError: false,
  })

  if (!clone.ok) {
    if (options.allowBundledFallback) {
      return {
        root: paths.bundledTemplateRoot,
        templateRoot: paths.bundledTemplateRoot,
        source: "bundled",
        updated: false,
        warning: clone.stderr || clone.stdout || "git clone failed",
      }
    }
    throw new Error(`Failed to clone foundation repository: ${clone.stderr || clone.stdout}`)
  }

  if (!(await hasFoundationTemplate(paths.cacheRoot, config))) {
    throw new Error(`Cloned foundation repository is missing ${config.templatePath}/package.json`)
  }

  return { root: paths.cacheRoot, source: "cloned-cache", updated: true }
}

export function foundationTemplateFromResult(result, config) {
  if (result.templateRoot) {
    return result.templateRoot
  }
  return getTemplateRoot(result.root, config)
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    windowsHide: true,
  })

  const status = result.status ?? 1
  const output = {
    ok: status === 0,
    status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
  }

  if (!output.ok && options.throwOnError !== false) {
    throw new Error(`${command} ${args.join(" ")} failed: ${output.stderr || output.stdout}`)
  }

  return output
}

export async function copyDirectory(source, target, options = {}) {
  const ignored = new Set(options.ignore ?? ["node_modules", "dist", "tmp", ".git"])
  await fs.mkdir(target, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })
  for (const entry of entries) {
    if (ignored.has(entry.name)) {
      continue
    }
    const sourcePath = path.join(source, entry.name)
    const targetPath = path.join(target, entry.name)
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath, options)
    } else {
      await fs.mkdir(path.dirname(targetPath), { recursive: true })
      await fs.copyFile(sourcePath, targetPath)
    }
  }
}

export async function writeFoundationReport(filePath, report) {
  await writeJson(filePath, {
    generatedAt: new Date().toISOString(),
    ...report,
  })
}

function tryUpdateGitRepo(root, branch) {
  if (!existsSync(path.join(root, ".git"))) {
    return skipped("not a git repository")
  }

  const status = run("git", ["status", "--short"], { cwd: root, throwOnError: false })
  if (!status.ok) {
    return skipped(status.stderr || "git status failed")
  }

  if (status.stdout.trim()) {
    return skipped("foundation worktree is dirty")
  }

  const fetch = run("git", ["fetch", "origin", branch], { cwd: root, throwOnError: false })
  if (!fetch.ok) {
    return skipped(fetch.stderr || "git fetch failed")
  }

  const pull = run("git", ["pull", "--ff-only", "origin", branch], { cwd: root, throwOnError: false })
  if (!pull.ok) {
    return skipped(pull.stderr || "git pull --ff-only failed")
  }

  return { updated: true, updateDetail: pull.stdout.trim() }
}

function skipped(reason) {
  return { updated: false, updateSkipped: true, updateReason: reason }
}
