import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AppSettings, DownloadProgressEvent } from "../types/app";
import {
  buildAuthAttempts,
  cleanAnalysisUrl,
  fileExists,
  resolveYtDlpPath,
  validateUrl,
} from "./ytDlpAnalysis";

type DownloadResult = {
  url: string;
  outputPath: string | null;
};

type ProgressCallback = (event: DownloadProgressEvent) => void;

const downloadTimeoutMs = 30 * 60_000;
const mediaExtensions = new Set(["mp4", "mkv", "webm", "mov", "avi", "mp3", "m4a", "wav", "opus"]);

export async function downloadLinkWithYtDlp(
  url: string,
  settings: AppSettings,
  projectRoot: string,
  onProgress: ProgressCallback,
): Promise<DownloadResult> {
  const normalizedUrl = validateUrl(url);
  const downloadUrl = cleanAnalysisUrl(normalizedUrl);
  await assertTargetFolder(settings.targetFolder);
  const ytDlp = await resolveYtDlpPath(settings, projectRoot);
  const attempts = await buildAuthAttempts(downloadUrl, settings, projectRoot);
  const ffmpegLocation = await resolveFfmpegLocation(projectRoot);
  const failures: string[] = [];
  const beforeFiles = await listMediaFiles(settings.targetFolder);

  for (const attempt of attempts) {
    const args = buildDownloadArgs(settings.targetFolder, attempt.args, ffmpegLocation, downloadUrl);
    console.log(`yt-dlp Download gestartet: ${downloadUrl}; ${attempt.label}; yt-dlp: ${ytDlp.label}`);

    try {
      await spawnDownload(ytDlp.command, args, onProgress);
      const outputPath = await findNewMediaFile(settings.targetFolder, beforeFiles);
      onProgress({
        phase: "complete",
        total: 100,
        download: 100,
        conversion: 0,
        status: "Download abgeschlossen",
      });
      console.log(`yt-dlp Download abgeschlossen: ${outputPath ?? "Datei nicht eindeutig erkannt"}`);

      return {
        url: downloadUrl,
        outputPath,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      failures.push(`${attempt.label}: ${message}`);
      console.warn(`yt-dlp Download-Versuch fehlgeschlagen (${attempt.label})`, error);
    }
  }

  throw new Error(formatDownloadFailure(downloadUrl, failures));
}

async function assertTargetFolder(targetFolder: string): Promise<void> {
  try {
    const stats = await fs.stat(targetFolder);

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

    throw new Error("Der Zielordner konnte nicht geprueft werden.");
  }
}

async function resolveFfmpegLocation(projectRoot: string): Promise<string | null> {
  const referenceFfmpeg = path.join(projectRoot, "reference", "Windows", "ffmpeg.exe");

  if (process.platform === "win32" && await fileExists(referenceFfmpeg)) {
    return path.dirname(referenceFfmpeg);
  }

  return null;
}

function buildDownloadArgs(
  targetFolder: string,
  authArgs: string[],
  ffmpegLocation: string | null,
  url: string,
): string[] {
  const runId = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 17);

  return [
    ...authArgs,
    "--newline",
    "--no-playlist",
    "--no-overwrites",
    "--windows-filenames",
    "-P",
    targetFolder,
    "-S",
    "vcodec:h264,acodec:aac,res,ext:mp4:m4a",
    "-f",
    "bv*+ba/b",
    "--merge-output-format",
    "mp4",
    ...(ffmpegLocation ? ["--ffmpeg-location", ffmpegLocation] : []),
    "-o",
    `%(title).120B [%(id)s] ${runId}.%(ext)s`,
    url,
  ];
}

function spawnDownload(command: string, args: string[], onProgress: ProgressCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: true,
    });
    let stderr = "";
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let settled = false;
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, downloadTimeoutMs);

    onProgress({
      phase: "download",
      total: 5,
      download: 0,
      conversion: 0,
      status: "Download laeuft...",
    });

    child.stdout.setEncoding("utf-8");
    child.stdout.on("data", (chunk: string) => {
      stdoutBuffer = consumeLines(stdoutBuffer + chunk, (line) => {
        handleProgressLine(line, onProgress);
      });
    });

    child.stderr.setEncoding("utf-8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      stderrBuffer = consumeLines(stderrBuffer + chunk, (line) => {
        handleProgressLine(line, onProgress);
      });
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);

      if ("code" in error && error.code === "ENOENT") {
        reject(new Error("yt-dlp wurde nicht gefunden. Lege yt-dlp in den Einstellungen fest oder installiere es im PATH."));
        return;
      }

      reject(new Error(`yt-dlp konnte nicht gestartet werden: ${error.message}`));
    });

    child.on("close", (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);

      if (timedOut) {
        reject(new Error("Der Download wurde nach 30 Minuten abgebrochen."));
        return;
      }

      if (code !== 0) {
        reject(new Error(formatYtDlpError(stderr)));
        return;
      }

      resolve();
    });
  });
}

function consumeLines(buffer: string, onLine: (line: string) => void): string {
  const lines = buffer.split(/\r?\n/);
  const rest = lines.pop() ?? "";

  for (const line of lines) {
    onLine(line.trim());
  }

  return rest;
}

function handleProgressLine(line: string, onProgress: ProgressCallback): void {
  if (!line) {
    return;
  }

  const downloadMatch = line.match(/\[download]\s+([0-9]+(?:\.[0-9]+)?)%/);

  if (downloadMatch) {
    const download = clampPercent(Number(downloadMatch[1]));
    onProgress({
      phase: "download",
      total: download,
      download,
      conversion: 0,
      status: "Download laeuft...",
    });
    return;
  }

  if (line.includes("[Merger]") || line.includes("[ExtractAudio]") || line.includes("[Convertor]")) {
    onProgress({
      phase: "conversion",
      total: 95,
      download: 100,
      conversion: 50,
      status: "Zusammenfuehrung laeuft...",
    });
  }
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

async function listMediaFiles(targetFolder: string): Promise<Set<string>> {
  const entries = await fs.readdir(targetFolder, { withFileTypes: true });
  const files = new Set<string>();

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).slice(1).toLowerCase();

    if (!mediaExtensions.has(extension)) {
      continue;
    }

    files.add(path.join(targetFolder, entry.name));
  }

  return files;
}

async function findNewMediaFile(targetFolder: string, beforeFiles: Set<string>): Promise<string | null> {
  const entries = await fs.readdir(targetFolder, { withFileTypes: true });
  let newestFile: { filePath: string; mtimeMs: number } | null = null;

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const filePath = path.join(targetFolder, entry.name);
    const extension = path.extname(entry.name).slice(1).toLowerCase();

    if (!mediaExtensions.has(extension) || beforeFiles.has(filePath) || await fileExists(`${filePath}.part`)) {
      continue;
    }

    const stats = await fs.stat(filePath);

    if (!newestFile || stats.mtimeMs > newestFile.mtimeMs) {
      newestFile = { filePath, mtimeMs: stats.mtimeMs };
    }
  }

  return newestFile?.filePath ?? null;
}

function formatYtDlpError(stderr: string): string {
  const cleanError = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-4)
    .join(" ");

  return cleanError
    ? `Download fehlgeschlagen: ${cleanError}`
    : "Download fehlgeschlagen. yt-dlp konnte die Datei nicht laden.";
}

function formatDownloadFailure(url: string, failures: string[]): string {
  if (new URL(url).hostname.toLowerCase().includes("instagram.com")) {
    const attempts = failures.length > 0
      ? ` Versucht wurde: ${failures.map((failure) => failure.split(":")[0]).join(", ")}.`
      : "";

    return `Instagram verlangt vermutlich Browser-Cookies. Bitte sicherstellen, dass der Beitrag im gewaehlten Browser geoeffnet werden kann.${attempts}`;
  }

  return failures.at(-1) ?? "Download fehlgeschlagen. yt-dlp konnte die Datei nicht laden.";
}
