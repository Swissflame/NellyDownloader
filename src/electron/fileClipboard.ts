import { clipboard } from "electron";
import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export type CopyFilesResult = {
  copied: boolean;
  fileIds: string[];
  message: string;
  mode: "files" | "paths";
};

export async function copyTargetFilesToClipboard(
  fileIds: string[],
  targetFolder: string,
): Promise<CopyFilesResult> {
  if (fileIds.length === 0) {
    return {
      copied: false,
      fileIds,
      mode: "paths",
      message: "Bitte zuerst mindestens eine Datei auswaehlen.",
    };
  }

  const filePaths = await resolveSelectedFiles(fileIds, targetFolder);
  const copiedAsFiles = process.platform === "win32"
    ? await tryWriteWindowsFileClipboard(filePaths)
    : false;

  if (copiedAsFiles) {
    return {
      copied: true,
      fileIds,
      mode: "files",
      message: filePaths.length === 1
        ? "1 Datei wurde in die Zwischenablage kopiert."
        : `${filePaths.length} Dateien wurden in die Zwischenablage kopiert.`,
    };
  }

  clipboard.writeText(filePaths.join(os.EOL));

  return {
    copied: true,
    fileIds,
    mode: "paths",
    message: filePaths.length === 1
      ? "1 Dateipfad wurde kopiert."
      : `${filePaths.length} Dateipfade wurden kopiert.`,
  };
}

async function resolveSelectedFiles(fileIds: string[], targetFolder: string): Promise<string[]> {
  const root = path.resolve(targetFolder);
  const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  const filePaths: string[] = [];

  for (const fileId of fileIds) {
    const fileName = validateFileId(fileId);
    const filePath = path.resolve(root, fileName);

    if (!filePath.startsWith(rootWithSeparator)) {
      throw new Error("Es duerfen nur Dateien aus dem aktuell eingestellten Zielordner kopiert werden.");
    }

    const stats = await fs.stat(filePath).catch((error: unknown) => {
      if (isMissingFileError(error)) {
        throw new Error(`Die Datei wurde nicht gefunden: ${fileName}`);
      }

      throw error;
    });

    if (!stats.isFile()) {
      throw new Error(`Es koennen nur normale Dateien kopiert werden: ${fileName}`);
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

function tryWriteWindowsFileClipboard(filePaths: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "Set-Clipboard -LiteralPath $args",
        ...filePaths,
      ],
      {
        shell: false,
        windowsHide: true,
      },
    );

    child.on("error", () => {
      resolve(false);
    });

    child.on("close", (code) => {
      resolve(code === 0);
    });
  });
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
