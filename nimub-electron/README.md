# Nimbus desktop

An Electron app containing Nimbus's Next.js interface. The folder and npm package are named `nimub-electron` as requested; the app is named **Nimbus**.

## Run

Use Node.js 22.12 or newer and npm. From this folder:

```sh
npm ci
npm start
```

`npm start` builds the bundled interface and opens the desktop window. After a successful build, `npm run desktop` opens it directly. The packaged app opens its bundled files through `nimbus://app/`. It works offline and does not start a web server.

Files, folders, and stars persist in Electron's application profile. Uploads use the system file picker. Downloads open a system Save dialog. File/Edit/View menus support normal desktop shortcuts, reload, zoom, and fullscreen. A second launch focuses the existing app window.

## Build distributables

```sh
npm run dist:linux
npm run dist:win
npm run dist:mac
```

The installers are written to `release/`. Linux builds produce an AppImage and tar.gz archive. Windows builds produce an NSIS installer; macOS builds produce a DMG. Build and test each target on its own operating system. Signing and macOS notarization require the owner's certificates and credentials; none are configured here. `npm run pack` creates an unpacked application for the current platform. No build command publishes releases.

On Linux, run the AppImage after marking it executable. Systems without FUSE can use the tar.gz archive or the AppImage's `--appimage-extract-and-run` option. Run the app as a normal user; the app enables Electron's renderer sandbox.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:desktop
```

The Electron smoke test uses an offscreen window and a separate temporary profile. It checks the bundled interface, renderer isolation, focus wrapping, folder creation, uploads, persistence after refresh and a complete process restart, and the actual bytes saved by a download. It writes its screenshot and JSON evidence to `artifacts/`. A desktop display is required for Electron on Linux.

## Implementation

- `electron/main.cjs`: window, app lifecycle, permissions, and native download dialogs.
- `electron/protocol.cjs`: bundled-file routing, path containment, and content security policy.
- `src/`: the copied Nimbus interface, with the empty-dialog focus bug corrected.
- `next.config.ts`: static export and local image loading.
- `build/icon.png`: the original Nimbus SVG rendered as a desktop icon.

The renderer uses `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`. Bundled HTML scripts receive content hashes in the content security policy. Foreign navigation, new windows, webviews, and permissions other than same-origin clipboard writing are rejected. Protocol routing rejects files outside the exported bundle. Implementation follows [Electron protocol documentation](https://www.electronjs.org/docs/latest/api/protocol) and [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security).

This remains a local frontend demo. Storage meters and collaborators are illustrative. There is no cloud synchronization, remote sharing, or authentication. The original web project is unchanged. Browser data from the web version is not migrated automatically into the separate desktop profile.

## Assets

The cloud illustration, brand artwork, website mockup, document and notebook previews are original SVGs. Landscape photos are from [Unsplash](https://unsplash.com): [ocean](https://images.unsplash.com/photo-1518837695005-2083093ee35b) and [mountains](https://images.unsplash.com/photo-1470770841072-f978cf4d019e). Typography uses [Manrope](https://github.com/sharanda/manrope); its SIL Open Font License is included in `public/fonts/OFL.txt`.
