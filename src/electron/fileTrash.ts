import { shell } from "electron";
import * as path from "node:path";
import { resolveSelectedTargetFiles } from "./targetFileSafety";

export type TrashFilesResult = {
  deleted: boolean;
  fileIds: string[];
  movedCount: number;
  failedCount: number;
  message: string;
};

export async function moveTargetFilesToTrash(
  fileIds: string[],
  targetFolder: string,
): Promise<TrashFilesResult> {
  if (fileIds.length === 0) {
    return {
      deleted: false,
      fileIds,
      movedCount: 0,
      failedCount: 0,
      message: "Bitte zuerst mindestens eine Datei auswaehlen.",
    };
  }

  const filePaths = await resolveSelectedTargetFiles(fileIds, targetFolder);
  let movedCount = 0;
  let failedCount = 0;

  for (const filePath of filePaths) {
    try {
      await shell.trashItem(filePath);
      movedCount += 1;
    } catch (error) {
      failedCount += 1;
      console.warn(`Datei konnte nicht in den Papierkorb verschoben werden: ${path.basename(filePath)}`, error);
    }
  }

  return {
    deleted: movedCount > 0,
    fileIds,
    movedCount,
    failedCount,
    message: formatTrashMessage(movedCount, failedCount),
  };
}

function formatTrashMessage(movedCount: number, failedCount: number): string {
  if (movedCount === 0 && failedCount > 0) {
    return failedCount === 1
      ? "1 Datei konnte nicht in den Papierkorb verschoben werden."
      : `${failedCount} Dateien konnten nicht in den Papierkorb verschoben werden.`;
  }

  if (failedCount > 0) {
    const movedLabel = movedCount === 1 ? "1 Datei verschoben" : `${movedCount} Dateien verschoben`;
    const failedLabel = failedCount === 1
      ? "1 Datei konnte nicht verschoben werden"
      : `${failedCount} Dateien konnten nicht verschoben werden`;

    return `${movedLabel}, ${failedLabel}.`;
  }

  return movedCount === 1
    ? "1 Datei wurde in den Papierkorb verschoben."
    : `${movedCount} Dateien wurden in den Papierkorb verschoben.`;
}
