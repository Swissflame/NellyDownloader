import * as path from "node:path";

export function getAssetPath(projectRoot: string, ...segments: string[]): string {
  return path.join(projectRoot, "assets", ...segments);
}
