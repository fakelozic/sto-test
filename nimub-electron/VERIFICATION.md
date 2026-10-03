# Electron verification — 3 October 2026

## Direct evidence

The Linux distribution build, lint, and TypeScript checks returned `"exit_code":0`.

The protocol test runner reported:

```text
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

The Electron smoke test was run against both the development export and the actual packaged code at `release/linux-unpacked/resources/app.asar`. It reported:

```text
PASS: bundled UI, assets, secure origin, and isolated renderer
PASS: folder creation and keyboard focus wrap
PASS: upload, refresh persistence, search, and downloaded bytes
PASS: process restart restored folders, file metadata, and downloaded bytes
PASS: fonts, image rendering, and browser console
PASS: desktop smoke test; evidence in artifacts/verification.json
```

The test launches two separate Electron processes with the same disposable profile. It compares the downloaded file's contents with the uploaded fixture after both a renderer refresh and a complete process restart. The final packaged-bundle report contains:

```json
"status": "PASS",
"electron": "44.5.1",
"platform": "linux",
"consoleErrors": []
```

The packaged archive inventory returned:

```json
{"files":57,"main":true,"html":true,"icon":true,"includesNodeModules":false}
```

Build outputs and SHA-256 hashes:

```text
0c00deca877f7fbe5883c951f8b89a8f73e649371d4794d15944362c1ce60533  release/Nimbus-1.0.0-linux-x86_64.AppImage
3d74dd4e1b3e9a9faf1674bc7d29bd95efb3f4938972d32e58551289c7aeb213  release/Nimbus-1.0.0-linux-x64.tar.gz
```

### Windows installer

The Windows NSIS packaging command returned `"exit_code":0`. Packaging completed in the official Electron build container:

```text
electronuserland/builder@sha256:41ae540902461b6cbc988987db79547fcc10cda04d2a6c6367504f59d4b37c64
v24.15.0
wine-11.0
```

Both `7z t` checks, for the installer and its embedded `app-64.7z` payload, reported:

```text
Everything is Ok
```

The extracted installer payload was compared with `release/win-unpacked`. The evidence report contains:

```json
"status": "BUILD_VERIFIED",
"verifiedFiles": 44,
"mismatches": [],
"embeddedFiles": [
  { "file": "app.asar", "matchesPackagedBundle": true },
  { "file": "Nimbus.exe", "matchesPackagedBundle": true }
]
```

The executable inspection returned:

```text
release/Nimbus-1.0.0-win-x64.exe: PE32 executable for MS Windows 4.00 (GUI), Intel i386, Nullsoft Installer self-extracting archive, 5 sections
release/win-unpacked/Nimbus.exe: PE32+ executable for MS Windows 10.00 (GUI), x86-64, 15 sections
```

The installer stub is 32-bit; its bundled application is x64. Both executables contain `"certificateBytes": 0` and `"iconGroups": 1`. Their resource metadata contains `"ProductName": "Nimbus"` and `"FileVersion": "1.0.0"`. This is an unsigned build.

Installer size and SHA-256:

```text
111744282 bytes
e6df136bea0dd2470ec26b565171ded6879b6fe00616827172293fac5cbc4f87  release/Nimbus-1.0.0-win-x64.exe
```

The full local evidence is in `artifacts/windows-verification.json`.

## Indirect evidence and limits

The screenshot supports visual inspection of the Electron renderer. The smoke test uses offscreen rendering, so it does not establish the appearance of operating-system window decorations.

No evidence found for Windows installation, launch, or runtime verification. Its installer was built and inspected on Linux. No evidence found for a macOS build or runtime verification. Native file-picker and Save-dialog selections were not exercised manually; upload events were supplied by the test and download destinations were set through Electron's test session. The AppImage and tar.gz containers were generated; their bundled application code was tested through Electron rather than through the AppImage launcher.

The build emitted a Linux desktop-window association advisory because `desktopName` is not configured. This does not establish a launch failure, but desktop-shell icon association remains unverified.

Logical-fallacy check: compilation alone would not establish that persistence or downloads work. Those conclusions are limited to the exercised Linux Electron runtime and are supported by the process-restart and downloaded-byte assertions.

Logical-fallacy check for Windows: a successful installer build and archive inspection do not establish successful installation or application behavior on Windows. The shared source and previous Linux runtime results are indirect evidence only for Windows behavior.

Screenshot: `artifacts/desktop.png`, generated locally by `npm run test:desktop`.
