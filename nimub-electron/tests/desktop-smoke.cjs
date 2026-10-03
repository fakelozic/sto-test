const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { app, session } = require("electron");
const root = path.resolve(__dirname, "..");
const bundleRoot = process.env.NIMUB_SMOKE_BUNDLE ? path.resolve(process.env.NIMUB_SMOKE_BUNDLE) : root;
const { registerAppProtocol, createWindow } = require(path.join(bundleRoot, "electron", "main.cjs"));
const artifacts = path.join(root, "artifacts");
const reopening = process.env.NIMUB_SMOKE_PHASE === "reopen";
const failures = [];
let temporary;
let window;
const deadline = setTimeout(() => { console.error("Desktop verification timed out"); app.exit(1); }, 45000);

function evaluate(code) { return window.webContents.executeJavaScript(code, true); }

async function waitFor(expression) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Renderer condition did not become true: ${expression}`);
}

function clickButton(name) {
  return evaluate(`(() => {
    const scope = document.querySelector('[role=dialog]') ?? document;
    const button = [...scope.querySelectorAll('button')].find(button =>
      button.getAttribute('aria-label') === ${JSON.stringify(name)} || button.textContent.trim() === ${JSON.stringify(name)});
    if (!button) throw new Error('Button not found: ' + ${JSON.stringify(name)});
    button.click();
  })()`);
}

function fillInput(selector, value) {
  return evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
}

(async () => {
  temporary = process.env.NIMUB_SMOKE_PROFILE ?? await fs.mkdtemp(path.join(os.tmpdir(), "nimub-electron-smoke-"));
  app.setPath("userData", temporary);
  await app.whenReady();
  app.on("web-contents-created", (_event, contents) => {
    contents.on("console-message", (_event, details) => {
      if (details.level === "error") failures.push(details.message);
    });
  });
  registerAppProtocol(bundleRoot);
  window = await createWindow({ show: false, bundleRoot });
  await waitFor(`document.querySelectorAll('.file-card').length === ${reopening ? 8 : 7} && !!localStorage.getItem('nimbus-library-v1')`);

  const boundary = await evaluate(`({ secure: isSecureContext, node: typeof require, process: typeof process })`);
  assert.deepEqual(boundary, { secure: true, node: "undefined", process: "undefined" });
  const preferences = window.webContents.getLastWebPreferences();
  assert.equal(preferences.sandbox, true);
  assert.equal(preferences.contextIsolation, true);
  assert.equal(preferences.nodeIntegration, false);
  const resources = await evaluate(`Promise.all(['/previews/coast.jpg', '/previews/brand.svg', '/previews/project-proposal.pdf'].map(async path => (await fetch(path)).status))`);
  assert.deepEqual(resources, [200, 200, 200]);
  console.log("PASS: bundled UI, assets, secure origin, and isolated renderer");

  const fixture = "Electron upload, persistence, and download verification.\n";
  if (!reopening) {
  await clickButton("New folder");
  await waitFor(`!!document.querySelector('[role=dialog]')`);
  const focus = await evaluate(`(() => {
    const cancel = [...document.querySelectorAll('[role=dialog] button')].find(button => button.textContent.trim() === 'Cancel');
    cancel.focus();
    cancel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    return { inside: !!document.activeElement.closest('[role=dialog]'), label: document.activeElement.getAttribute('aria-label') };
  })()`);
  assert.deepEqual(focus, { inside: true, label: "Close dialog" });
  await fillInput("#folder-name", "Desktop verification");
  await waitFor(`!document.querySelector('[role=dialog] button[type=submit]').disabled`);
  await clickButton("Create folder");
  await waitFor(`!document.querySelector('[role=dialog]') && document.querySelector('#folder-title').textContent.includes('5')`);
  console.log("PASS: folder creation and keyboard focus wrap");

  await evaluate(`(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([${JSON.stringify(fixture)}], 'desktop-check.txt', { type: 'text/plain' }));
    const input = document.querySelector('input[type=file]');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor(`document.body.textContent.includes('desktop-check.txt added to your space')`);
  await waitFor(`JSON.parse(localStorage.getItem('nimbus-library-v1')).files.some(file => file.name === 'desktop-check.txt')`);
  await session.defaultSession.flushStorageData();
  await window.loadURL("nimbus://app/");
  }
  await waitFor(`!!document.querySelector('[aria-label="Actions for desktop-check.txt"]') && document.querySelector('#folder-title').textContent.includes('5')`);

  await fillInput('[aria-label="Search files"]', "desktop-check");
  await waitFor(`document.querySelectorAll('.file-card').length === 1`);
  const destination = path.join(temporary, "saved-desktop-check.txt");
  const download = new Promise((resolve, reject) => {
    session.defaultSession.once("will-download", (_event, item) => {
      item.setSavePath(destination);
      item.once("done", (_event, state) => state === "completed" ? resolve() : reject(new Error(`Download ${state}`)));
    });
  });
  await clickButton("Actions for desktop-check.txt");
  await waitFor(`!!document.querySelector('[role=menu]')`);
  await clickButton("Download");
  await download;
  assert.equal(await fs.readFile(destination, "utf8"), fixture);
  console.log(reopening ? "PASS: process restart restored folders, file metadata, and downloaded bytes" : "PASS: upload, refresh persistence, search, and downloaded bytes");

  await fillInput('[aria-label="Search files"]', "");
  await waitFor(`document.querySelectorAll('.file-card').length === 8`);
  await evaluate(`document.fonts.ready.then(() => true)`);
  await waitFor(`[...document.querySelectorAll('.preview-image')].filter(image => image.getBoundingClientRect().top < innerHeight).every(image => image.complete && image.naturalWidth > 0)`);
  assert.deepEqual(failures, []);
  console.log("PASS: fonts, image rendering, and browser console");
  await fs.mkdir(artifacts, { recursive: true });
  await fs.writeFile(path.join(artifacts, "desktop.png"), (await window.webContents.capturePage()).toPNG());
  const checks = reopening
    ? [...JSON.parse(await fs.readFile(path.join(artifacts, "verification.json"), "utf8")).checks, "process restart persistence"]
    : ["bundled assets", "renderer isolation", "keyboard focus", "folder creation", "upload", "refresh persistence", "search", "downloaded bytes"];
  await fs.writeFile(path.join(artifacts, "verification.json"), JSON.stringify({
    status: "PASS",
    electron: process.versions.electron,
    platform: process.platform,
    bundle: bundleRoot,
    renderer: boundary,
    consoleErrors: failures,
    checks,
  }, null, 2));
  console.log("PASS: desktop smoke test; evidence in artifacts/verification.json");
  clearTimeout(deadline);
  window.destroy();
  app.exit(0);
})().catch(async (error) => {
  console.error(error);
  await fs.mkdir(artifacts, { recursive: true });
  if (window && !window.isDestroyed()) {
    await fs.writeFile(path.join(artifacts, "desktop-failure.png"), (await window.webContents.capturePage()).toPNG());
  }
  clearTimeout(deadline);
  app.exit(1);
});
