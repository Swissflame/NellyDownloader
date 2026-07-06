import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function resolveSelectedTargetFiles(fileIds: string[], targetFolder: string): Promise<string[]> {
  const root = path.resolve(targetFolder);
  const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  const filePaths: string[] = [];

  for (const fileId of fileIds) {
    const fileName = validateFileId(fileId);
    const filePath = path.resolve(root, fileName);

    if (!filePath.startsWith(rootWithSeparator)) {
      throw new Error("Es duerfen nur Dateien aus dem aktuell eingestellten Zielordner verwendet werden.");
    }

    const stats = await fs.stat(filePath).catch((error: unknown) => {
      if (isMissingFileError(error)) {
        throw new Error(`Die Datei wurde nicht gefunden: ${fileName}`);
      }

      throw error;
    });

    if (!stats.isFile()) {
      throw new Error(`Es koennen nur normale Dateien verwendet werden: ${fileName}`);
    }

    filePaths.push(filePath);
  }

  return filePaths;
}

function validateFileId(fileId: string): string {
  if (typeof fileId !== "string" || !fileId.trim()) {
    throw new Error("Die Dateiauswahl ist ungueltig.");
  }

  const fileName = fileId.trim();

  if (
    path.isAbsolute(fileName)
    || fileName.includes("/")
    || fileName.includes("\\")
    || fileName === "."
    || fileName === ".."
    || path.basename(fileName) !== fileName
  ) {
    throw new Error("Die Dateiauswahl enthaelt einen ungueltigen Dateinamen.");
  }

  return fileName;
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
