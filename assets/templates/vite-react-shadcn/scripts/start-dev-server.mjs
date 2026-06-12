#!/usr/bin/env node
import fs from "node:fs"
import fsp from "node:fs/promises"
import http from "node:http"
import net from "node:net"
import path from "node:path"
import { spawn } from "node:child_process"

const args = parseArgs()
const host = String(args.host ?? "127.0.0.1")
const bindHost = String(args["bind-host"] ?? "0.0.0.0")
const preferredPort = Number(args.port ?? 5173)
const timeoutMs = Number(args.timeout ?? 30000)
const outDir = path.resolve(String(args["out-dir"] ?? "tmp"))
const stdoutPath = path.join(outDir, "dev-server.stdout.log")
const stderrPath = path.join(outDir, "dev-server.stderr.log")
const reportPath = path.join(outDir, "dev-server.json")

await fsp.mkdir(outDir, { recursive: true })

const preferredUrl = `http://${host}:${preferredPort}/`
if (await isHttpReady(preferredUrl, 1500)) {
  await writeReport({
    tool: "start-dev-server",
    pass: true,
    reused: true,
    url: preferredUrl,
    port: preferredPort,
    pid: null,
    message: "Existing dev server is already responding.",
  })
  await printLine(preferredUrl)
  process.exit(0)
}

const port = await choosePort(preferredPort)
const url = `http://${host}:${port}/`

if (await isHttpReady(url, 1500)) {
  await writeReport({
    tool: "start-dev-server",
    pass: true,
    reused: true,
    url,
    port,
    pid: null,
    message: "Existing dev server is already responding.",
  })
  await printLine(url)
  process.exit(0)
}

const npmArgs = [
  "run",
  "dev",
  "--",
  "--host",
  bindHost,
  "--port",
  String(port),
  "--strictPort",
]
const command = process.platform === "win32" ? (process.env.ComSpec || "cmd.exe") : "npm"
const commandArgs = process.platform === "win32"
  ? ["/d", "/s", "/c", "npm.cmd", ...npmArgs]
  : npmArgs
const stdout = fs.openSync(stdoutPath, "a")
const stderr = fs.openSync(stderrPath, "a")
const child = spawn(command, commandArgs, {
  cwd: process.cwd(),
  shell: false,
  stdio: ["ignore", stdout, stderr],
  windowsHide: true,
})

try {
  await waitForUrl(url, timeoutMs)
  printLine(url)
  await writeReport({
    tool: "start-dev-server",
    pass: true,
    reused: false,
    url,
    port,
    pid: child.pid,
    command,
    args: commandArgs,
    stdoutPath,
    stderrPath,
  })
  child.unref()
} catch (error) {
  await writeReport({
    tool: "start-dev-server",
    pass: false,
    url,
    port,
    pid: child.pid,
    command,
    args: commandArgs,
    stdoutPath,
    stderrPath,
    error: error.message,
  })
  child.kill()
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
      continue
    }
    parsed[key] = next
    index += 1
  }
  return parsed
}

async function choosePort(startPort) {
  for (let port = startPort; port < startPort + 80; port += 1) {
    if (await canBind(port)) {
      return port
    }
  }
  throw new Error(`No available port found from ${startPort} to ${startPort + 79}`)
}

function canBind(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once("error", () => resolve(false))
    server.once("listening", () => {
      server.close(() => resolve(true))
    })
    server.listen(port, "127.0.0.1")
  })
}

async function waitForUrl(url, timeoutMs) {
  const start = Date.now()
  let lastError = null
  while (Date.now() - start < timeoutMs) {
    try {
      if (await isHttpReady(url, 1500)) return
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message ?? "no response"}`)
}

function isHttpReady(url, timeoutMs) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      response.resume()
      resolve(response.statusCode < 500)
    })
    request.on("timeout", () => {
      request.destroy()
      resolve(false)
    })
    request.on("error", () => resolve(false))
  })
}

async function writeReport(report) {
  await fsp.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
}

function printLine(message) {
  fs.writeSync(1, `${message}\n`)
}
