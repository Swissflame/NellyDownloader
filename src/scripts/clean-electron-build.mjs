import { rm } from "node:fs/promises";
import path from "node:path";

await rm(path.resolve("dist-electron"), {
  force: true,
  recursive: true,
});
