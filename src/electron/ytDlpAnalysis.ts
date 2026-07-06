import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AppSettings, LinkDetails } from "../types/app";

type YtDlpMetadata = {
  extractor?: string;
  extractor_key?: string;
  title?: string;
  uploader?: string;
  channel?: string;
  creator?: string;
  id?: string;
  duration?: number;
  duration_string?: string;
  thumbnail?: string;
  thumbnails?: Array<{ url?: string }>;
};

const analysisTimeoutMs = 60_000;

export async function analyzeLinkWithYtDlp(
  url: string,
  settings: AppSettings,
  projectRoot: string,
): Promise<LinkDetails & { url: string }> {
  const normalizedUrl = validateUrl(url);
  const ytDlpPath = await resolveYtDlpPath(settings, projectRoot);

  console.log(`yt-dlp Analyse gestartet: ${normalizedUrl}`);
  const metadata = await runYtDlpMetadata(ytDlpPath, normalizedUrl);
  console.log("yt-dlp Analyse erfolgreich");

  return {
    url: normalizedUrl,
    platform: metadata.extractor_key ?? metadata.extractor ?? "Unbekannt",
    title: metadata.title ?? "-",
    creator: metadata.uploader ?? metadata.channel ?? metadata.creator ?? "-",
    videoId: metadata.id ?? "-",
    duration: formatDuration(metadata),
    thumbnailLabel: metadata.thumbnail ? "Thumbnail" : "Vorschau",
    thumbnailUrl: metadata.thumbnail ?? metadata.thumbnails?.find((thumbnail) => thumbnail.url)?.url ?? null,
    expectedOutput: settings.preferredFormat,
    cookiesHint: "Keine Cookie-Prüfung ausgeführt. Falls die Analyse fehlschlägt, können später Cookies nötig sein.",
    error: null,
  };
}

function validateUrl(rawUrl: string): string {
  try {
    const parsedUrl = new URL(rawUrl.trim());

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Nur http:// und https:// Links werden unterstützt.");
    }

    return parsedUrl.toString();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Nur ")) {
      throw error;
    }

    throw new Error("Bitte gib einen gültigen http:// oder https:// Link ein.");
  }
}

async function resolveYtDlpPath(settings: AppSettings, projectRoot: string): Promise<string> {
  if (settings.ytDlpPath) {
    if (await fileExists(settings.ytDlpPath)) {
      return settings.ytDlpPath;
    }

    throw new Error("Der in den Einstellungen gespeicherte yt-dlp-Pfad wurde nicht gefunden.");
  }

  const referencePath = path.join(projectRoot, "reference", "Windows", "yt-dlp.exe");

  if (process.platform === "win32" && await fileExists(referencePath)) {
    return referencePath;
  }

  return process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function runYtDlpMetadata(ytDlpPath: string, url: string): Promise<YtDlpMetadata> {
  const output = await spawnForText(ytDlpPath, ["--dump-json", "--no-playlist", "--skip-download", url]);

  try {
    return JSON.parse(output) as YtDlpMetadata;
  } catch {
    throw new Error("yt-dlp hat keine lesbaren Metadaten zurückgegeben.");
  }
}

function spawnForText(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, analysisTimeoutMs);

    child.stdout.setEncoding("utf-8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.setEncoding("utf-8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
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
        reject(new Error("Die Link-Analyse wurde nach 60 Sekunden abgebrochen."));
        return;
      }

      if (code !== 0) {
        reject(new Error(formatYtDlpError(stderr)));
        return;
      }

      resolve(stdout);
    });
  });
}

function formatYtDlpError(stderr: string): string {
  const cleanError = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-3)
    .join(" ");

  return cleanError
    ? `Link-Analyse fehlgeschlagen: ${cleanError}`
    : "Link-Analyse fehlgeschlagen. yt-dlp konnte keine Metadaten lesen.";
}

function formatDuration(metadata: YtDlpMetadata): string {
  if (metadata.duration_string) {
    return metadata.duration_string;
  }

  if (typeof metadata.duration !== "number") {
    return "-";
  }

  const hours = Math.floor(metadata.duration / 3600);
  const minutes = Math.floor((metadata.duration % 3600) / 60);
  const seconds = Math.floor(metadata.duration % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
