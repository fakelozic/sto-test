const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const { mkdtemp, mkdir, writeFile, symlink, rm } = require("node:fs/promises");
const { createHash } = require("node:crypto");
const { isAppUrl, resolveAsset, contentSecurityPolicy, createAssetHandler } = require("../electron/protocol.cjs");

test("only the exact bundled app origin is trusted", () => {
  assert.equal(isAppUrl("nimbus://app/"), true);
  assert.equal(isAppUrl("nimbus://app/_next/example.js"), true);
  for (const url of ["https://app/", "nimbus://app.example/", "nimbus://app:123/", "nimbus://user@app/", "file:///etc/passwd", "garbage"]) {
    assert.equal(isAppUrl(url), false, url);
  }
});

test("root and nested asset paths resolve inside the export", () => {
  const root = path.resolve("bundle");
  assert.equal(resolveAsset(root, "nimbus://app/"), path.join(root, "index.html"));
  assert.equal(resolveAsset(root, "nimbus://app/_next/static/app.js?v=1"), path.join(root, "_next/static/app.js"));
  assert.equal(resolveAsset(root, "nimbus://app/photos/"), path.join(root, "photos/index.html"));
});

test("encoded traversal, malformed paths, and foreign origins are rejected", () => {
  const root = path.resolve("bundle");
  for (const url of ["nimbus://app/%2e%2e%2fsecret", "nimbus://app/%5c..%5csecret", "nimbus://app/%00", "nimbus://app/%ZZ", "nimbus://other/index.html"]) {
    assert.equal(resolveAsset(root, url), null, url);
  }
});

test("CSP hashes generated inline scripts without permitting arbitrary inline execution", () => {
  const script = 'self.__next_f.push([1,"hello"])';
  const hash = createHash("sha256").update(script).digest("base64");
  const policy = contentSecurityPolicy(`<script>${script}</script><script src="/app.js"></script>`);
  assert.ok(policy.includes(`'sha256-${hash}'`));
  assert.ok(policy.includes("object-src 'none'"));
  assert.ok(policy.includes("frame-ancestors 'none'"));
  assert.ok(!policy.split(";").find((part) => part.trim().startsWith("script-src")).includes("unsafe-inline"));
  assert.ok(!policy.includes("unsafe-eval"));
});

test("asset handler returns 404/405 and refuses symlinks outside the bundle", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "nimbus-protocol-"));
  try {
    const root = path.join(temporary, "out");
    await mkdir(root);
    await writeFile(path.join(temporary, "private.txt"), "private");
    await symlink(path.join(temporary, "private.txt"), path.join(root, "escape.txt"));
    const handler = createAssetHandler(root, () => { throw new Error("Unexpected file access"); });
    assert.equal((await handler(new Request("nimbus://app/missing.txt"))).status, 404);
    assert.equal((await handler(new Request("nimbus://app/escape.txt"))).status, 403);
    assert.equal((await handler(new Request("nimbus://app/", { method: "POST" }))).status, 405);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("HTML responses carry script hashes and assets retain their MIME type", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "nimbus-response-"));
  try {
    await writeFile(path.join(root, "index.html"), "<script>console.log('bundled')</script>");
    const handler = createAssetHandler(root, async () => new Response("html", { headers: { "Content-Type": "text/html" } }));
    const response = await handler(new Request("nimbus://app/"));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/html");
    assert.ok(response.headers.get("content-security-policy").includes("sha256-"));
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(await response.text(), "html");
    const head = await handler(new Request("nimbus://app/", { method: "HEAD" }));
    assert.equal(await head.text(), "");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
