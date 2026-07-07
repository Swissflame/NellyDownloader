import { shell } from "electron";
import * as fs from "node:fs/promises";
import { resolveSelectedTargetFiles } from "./targetFileSafety";

export type OpenTargetFolderResult = {
  opened: boolean;
  message: string;
};

export type RevealFileResult = {
  revealed: boolean;
  fileIds: string[];
  message: string;
};

export async function openTargetFolderInExplorer(targetFolder: string): Promise<OpenTargetFolderResult> {
  await assertExistingDirectory(targetFolder);
  const errorMessage = await shell.openPath(targetFolder);

  if (errorMessage) {
    throw new Error(`Der Zielordner konnte nicht geoeffnet werden: ${errorMessage}`);
  }

  return {
    opened: true,
    message: "Zielordner wurde im Explorer geoeffnet.",
  };
}

export async function revealTargetFileInExplorer(
  fileId: string,
  targetFolder: string,
): Promise<RevealFileResult> {
  const [filePath] = await resolveSelectedTargetFiles([fileId], targetFolder);
  shell.showItemInFolder(filePath);

  return {
    revealed: true,
    fileIds: [fileId],
    message: "Datei wurde im Explorer angezeigt.",
  };
}

async function assertExistingDirectory(folderPath: string): Promise<void> {
  try {
    const stats = await fs.stat(folderPath);

    if (!stats.isDirectory()) {
      throw new Error("Der gespeicherte Zielordner ist kein Ordner.");
    }
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      throw new Error("Der gespeicherte Zielordner existiert nicht. Bitte waehle in den Einstellungen einen gueltigen Ordner aus.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Der Zielordner konnte nicht geoeffnet werden.");
  }
}
