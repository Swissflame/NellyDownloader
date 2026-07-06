import { clipboard } from "electron";
import { spawn } from "node:child_process";
import * as os from "node:os";
import { resolveSelectedTargetFiles } from "./targetFileSafety";

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

  const filePaths = await resolveSelectedTargetFiles(fileIds, targetFolder);
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
