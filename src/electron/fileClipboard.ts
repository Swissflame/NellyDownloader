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
    message: "Dateiablage nicht verfügbar, Dateipfade wurden kopiert.",
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
    const encodedFilePaths = Buffer.from(JSON.stringify(filePaths), "utf-8").toString("base64");
    const script = [
      "$ErrorActionPreference = 'Stop'",
      "Add-Type -AssemblyName System.Windows.Forms",
      "$json = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($env:NELLY_FILE_CLIPBOARD_B64))",
      "$files = ConvertFrom-Json -InputObject $json",
      "$collection = New-Object System.Collections.Specialized.StringCollection",
      "foreach ($file in $files) { [void] $collection.Add([string] $file) }",
      "[System.Windows.Forms.Clipboard]::SetFileDropList($collection)",
    ].join("; ");
    const child = spawn(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-STA",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
      ],
      {
        env: {
          ...process.env,
          NELLY_FILE_CLIPBOARD_B64: encodedFilePaths,
        },
        shell: false,
        windowsHide: true,
      },
    );
    let stderr = "";

    child.stderr.setEncoding("utf-8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      console.warn("Datei-Zwischenablage konnte nicht gestartet werden.", error);
      resolve(false);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.warn("Datei-Zwischenablage nicht verfügbar.", stderr.trim());
      }

      resolve(code === 0);
    });
  });
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
