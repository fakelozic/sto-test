const path = require("node:path");
const { existsSync } = require("node:fs");
const { app, BrowserWindow, Menu, dialog, net, protocol, session } = require("electron");
const { APP_URL, isAppUrl, createAssetHandler } = require("./protocol.cjs");

protocol.registerSchemesAsPrivileged([{
  scheme: "nimbus",
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
}]);

function registerAppProtocol(bundleRoot = app.getAppPath()) {
  const root = path.join(bundleRoot, "out");
  protocol.handle("nimbus", createAssetHandler(root, (url, options) => net.fetch(url, options)));

  session.defaultSession.setPermissionCheckHandler((_contents, permission, origin) =>
    permission === "clipboard-sanitized-write" && isAppUrl(origin));
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback, details) =>
    callback(permission === "clipboard-sanitized-write" && isAppUrl(details.requestingUrl)));

  session.defaultSession.on("will-download", (event, item, contents) => {
    if (!isAppUrl(contents?.getURL()) || !isAppUrl(item.getInitiatorOrigin())) {
      event.preventDefault();
      return;
    }
    item.setSaveDialogOptions({
      title: "Save a copy",
      defaultPath: path.join(app.getPath("downloads"), path.basename(item.getFilename())),
    });
    item.once("done", (_event, state) => {
      if (state === "interrupted") {
        dialog.showErrorBox("Download interrupted", "The file could not be saved. Please try again.");
      }
    });
  });
}

async function createWindow({ show = true, bundleRoot = app.getAppPath() } = {}) {
  if (!existsSync(path.join(bundleRoot, "out", "index.html"))) {
    throw new Error("Nimbus's bundled interface is missing. Run npm run build first.");
  }
  const window = new BrowserWindow({
    title: "Nimbus",
    width: 1360,
    height: 920,
    minWidth: 380,
    minHeight: 600,
    show: false,
    backgroundColor: "#fafaf7",
    icon: path.join(bundleRoot, "build", "icon.png"),
    autoHideMenuBar: process.platform !== "darwin",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      navigateOnDragDrop: false,
      spellcheck: false,
      offscreen: !show,
      backgroundThrottling: show,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!isAppUrl(url)) event.preventDefault();
  });
  window.webContents.on("will-redirect", (event, url) => {
    if (!isAppUrl(url)) event.preventDefault();
  });
  window.webContents.on("will-attach-webview", (event) => event.preventDefault());
  window.webContents.on("render-process-gone", (_event, details) => {
    if (details.reason !== "clean-exit") console.error("Nimbus renderer stopped:", details.reason);
  });
  await window.loadURL(APP_URL);
  if (show) window.show();
  return window;
}

function installMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    { label: "File", submenu: [{ role: "close" }, ...(process.platform === "darwin" ? [] : [{ role: "quit" }])] },
    { role: "editMenu" },
    { label: "View", submenu: [
      { role: "reload" },
      ...(!app.isPackaged ? [{ role: "toggleDevTools" }] : []),
      { type: "separator" },
      { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" },
      { type: "separator" }, { role: "togglefullscreen" },
    ] },
    { role: "windowMenu" },
  ]));
}

if (require.main === module) {
  app.setName("Nimbus");
  if (!app.requestSingleInstanceLock()) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      const window = BrowserWindow.getAllWindows()[0];
      if (window?.isMinimized()) window.restore();
      window?.show();
      window?.focus();
    });
    app.whenReady().then(async () => {
      registerAppProtocol();
      installMenu();
      await createWindow();
      app.on("activate", async () => {
        if (!BrowserWindow.getAllWindows().length) await createWindow();
      });
    }).catch((error) => {
      console.error(error);
      dialog.showErrorBox("Nimbus could not open", error.message);
      app.quit();
    });
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });
  }
}

module.exports = { registerAppProtocol, createWindow };
