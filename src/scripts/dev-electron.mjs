import { spawn, spawnSync } from "node:child_process";
import electronPath from "electron";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const electronCommand = electronPath;
const devServerUrl = "http://127.0.0.1:5173";
const isSmokeTest = process.env.NELLY_ELECTRON_SMOKE_TEST === "1";

const vite = isSmokeTest
  ? undefined
  : spawn(npmCommand, ["run", "dev", "--", "--port", "5173"], {
    cwd: process.cwd(),
    env: process.env,
    shell: isWindows,
    stdio: "inherit",
  });

let electron;
let shuttingDown = false;

async function waitForDevServer() {
  const timeoutAt = Date.now() + 30000;

  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(devServerUrl);

      if (response.ok) {
        return;
      }
    } catch {
      // Vite is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Vite-Dev-Server wurde nicht rechtzeitig gestartet.");
}

function stopChild(child) {
  if (child && !child.killed) {
    if (isWindows && child.pid) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      return;
    }

    child.kill();
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopChild(electron);
  stopChild(vite);
  process.exit(exitCode);
}

vite?.on("exit", (code) => {
  if (!shuttingDown && code !== 0) {
    shutdown(code ?? 1);
  }
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  if (!isSmokeTest) {
    await waitForDevServer();
  }

  const electronEnv = {
    ...process.env,
  };

  if (!isSmokeTest) {
    electronEnv.NELLY_ELECTRON_DEV_URL = devServerUrl;
  }

  delete electronEnv.ELECTRON_RUN_AS_NODE;

  electron = spawn(electronCommand, ["."], {
    cwd: process.cwd(),
    env: electronEnv,
    shell: false,
    stdio: "inherit",
  });

  electron.on("exit", (code) => {
    shutdown(code ?? 0);
  });
} catch (error) {
  console.error(error);
  shutdown(1);
}
