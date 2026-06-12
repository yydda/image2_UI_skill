#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";

const [rootArg, portArg, hostArg = "127.0.0.1"] = process.argv.slice(2);

if (!rootArg || !portArg) {
  console.error("Usage: node scripts/serve-static.mjs <root> <port> [host]");
  process.exit(2);
}

const root = path.resolve(rootArg);
const port = Number(portArg);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`Invalid port: ${portArg}`);
  process.exit(2);
}

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"],
]);

function isInsideRoot(target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

const server = http.createServer((request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${hostArg}:${port}`);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const relativePath = decodedPath.replace(/^\/+/, "") || "index.html";
    let target = path.resolve(root, relativePath);

    if (!isInsideRoot(target)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (existsSync(target) && statSync(target).isDirectory()) {
      target = path.join(target, "index.html");
    }

    if (!existsSync(target) || !statSync(target).isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes.get(path.extname(target).toLowerCase()) ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    createReadStream(target).pipe(response);
  } catch (error) {
    response.writeHead(500);
    response.end(error instanceof Error ? error.message : String(error));
  }
});

server.listen(port, hostArg, () => {
  console.log(`Serving ${root} at http://${hostArg}:${port}/`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
