const path = require("node:path");
const { createHash } = require("node:crypto");
const { readFile, realpath, stat } = require("node:fs/promises");
const { pathToFileURL } = require("node:url");

const APP_URL = "nimbus://app/";

function isAppUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "nimbus:" && url.host === "app" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isWithin(root, file) {
  const relative = path.relative(root, file);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function resolveAsset(root, requestUrl) {
  if (!isAppUrl(requestUrl)) return null;
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl).pathname);
  } catch {
    return null;
  }
  if (pathname.includes("\0") || pathname.includes("\\")) return null;
  if (pathname.endsWith("/")) pathname += "index.html";
  const file = path.resolve(root, `.${pathname}`);
  return isWithin(root, file) ? file : null;
}

function contentSecurityPolicy(html = "") {
  const hashes = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (!/\bsrc\s*=/i.test(match[1]) && match[2]) {
      hashes.push(`'sha256-${createHash("sha256").update(match[2]).digest("base64")}'`);
    }
  }
  return [
    "default-src 'self'",
    `script-src 'self' ${[...new Set(hashes)].join(" ")}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' blob:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join("; ");
}

function createAssetHandler(root, fetchFile) {
  const policies = new Map();
  return async (request) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const file = resolveAsset(root, request.url);
    if (!file) return new Response("Forbidden", { status: 403 });
    try {
      const [realRoot, realFile] = await Promise.all([realpath(root), realpath(file)]);
      if (!isWithin(realRoot, realFile)) return new Response("Forbidden", { status: 403 });
      if (!(await stat(realFile)).isFile()) return new Response("Not found", { status: 404 });
      const response = await fetchFile(pathToFileURL(realFile).toString(), { method: request.method });
      const headers = new Headers(response.headers);
      if (path.extname(file) === ".html") {
        if (!policies.has(file)) policies.set(file, contentSecurityPolicy(await readFile(file, "utf8")));
        headers.set("Content-Security-Policy", policies.get(file));
      }
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(request.method === "HEAD" ? null : response.body, {
        status: response.status,
        headers,
      });
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") console.error("Asset request failed:", error);
      return new Response("Not found", { status: 404 });
    }
  };
}

module.exports = { APP_URL, isAppUrl, resolveAsset, contentSecurityPolicy, createAssetHandler };
