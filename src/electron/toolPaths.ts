import { app } from "electron";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export type ExternalToolName = "yt-dlp" | "ffmpeg" | "ffprobe";

export type ExternalToolCommand = {
  command: string;
  label: string;
};

export async function resolveBundledToolPath(toolName: ExternalToolName): Promise<ExternalToolCommand | null> {
  if (!app.isPackaged || process.platform !== "win32") {
    return null;
  }

  const executableName = `${toolName}.exe`;
  const bundledPath = path.join(process.resourcesPath, "tools", "win", executableName);

  if (!await isFile(bundledPath)) {
    return null;
  }

  return {
    command: bundledPath,
    label: `mitgeliefert (${executableName})`,
  };
}

export function pathToolCommand(toolName: ExternalToolName): ExternalToolCommand {
  return {
    command: process.platform === "win32" ? `${toolName}.exe` : toolName,
    label: "PATH",
  };
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}
