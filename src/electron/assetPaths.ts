import * as path from "node:path";

export function getAssetPath(projectRoot: string, isPackaged: boolean, ...segments: string[]): string {
  const assetRoot = isPackaged
    ? path.join(process.resourcesPath, "assets")
    : path.join(projectRoot, "assets");

  return path.join(assetRoot, ...segments);
}
