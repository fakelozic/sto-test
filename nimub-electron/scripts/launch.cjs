const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs/promises");
const { spawn } = require("node:child_process");
const electron = require("electron");
const root = path.resolve(__dirname, "..");
const testing = process.argv.includes("--test");
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const args = [testing ? path.join(root, "tests", "desktop-smoke.cjs") : root];
if (testing) args.push("--disable-gpu");
let child;
function run(environment) {
  return new Promise((resolve, reject) => {
    child = spawn(electron, args, { cwd: root, env: environment, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1)));
  });
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child?.kill(signal));

(async () => {
  if (!testing) {
    process.exitCode = await run(env);
    return;
  }
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), "nimub-electron-test-"));
  try {
    const testEnvironment = { ...env, NIMUB_SMOKE_PROFILE: profile };
    const first = await run(testEnvironment);
    process.exitCode = first || await run({ ...testEnvironment, NIMUB_SMOKE_PHASE: "reopen" });
  } finally {
    await fs.rm(profile, { recursive: true, force: true, maxRetries: 3 });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
