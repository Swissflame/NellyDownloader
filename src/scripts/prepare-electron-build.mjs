import { rm, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const electronOutputDir = path.resolve("dist-electron", "electron");

async function renameIfExists(from, to) {
  if (existsSync(to)) {
    await rm(to);
  }

  if (existsSync(from)) {
    await rename(from, to);
  }
}

await renameIfExists(
  path.join(electronOutputDir, "main.js"),
  path.join(electronOutputDir, "main.cjs"),
);

await renameIfExists(
  path.join(electronOutputDir, "preload.js"),
  path.join(electronOutputDir, "preload.cjs"),
);
