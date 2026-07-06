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

export type YtDlpCommand = {
  command: string;
  label: string;
};

export type AuthAttempt = {
  label: string;
  args: string[];
};

const analysisTimeoutMs = 60_000;
const instagramTrackingParams = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "igsh",
  "igshid",
  "fbclid",
]);

export async function analyzeLinkWithYtDlp(
  url: string,
  settings: AppSettings,
  projectRoot: string,
): Promise<LinkDetails & { url: string }> {
  const normalizedUrl = validateUrl(url);
  const analysisUrl = cleanAnalysisUrl(normalizedUrl);
  const ytDlp = await resolveYtDlpPath(settings, projectRoot);

  console.log(`yt-dlp Analyse gestartet: ${analysisUrl}`);
  const result = await runYtDlpMetadata(ytDlp, analysisUrl, settings, projectRoot);
  console.log(`yt-dlp Analyse erfolgreich (${result.cookieHint})`);

  return {
    url: analysisUrl,
    platform: result.metadata.extractor_key ?? result.metadata.extractor ?? "Unbekannt",
    title: result.metadata.title ?? "-",
    creator: result.metadata.uploader ?? result.metadata.channel ?? result.metadata.creator ?? "-",
    videoId: result.metadata.id ?? "-",
    duration: formatDuration(result.metadata),
    thumbnailLabel: result.metadata.thumbnail ? "Thumbnail" : "Vorschau",
    thumbnailUrl: result.metadata.thumbnail ?? result.metadata.thumbnails?.find((thumbnail) => thumbnail.url)?.url ?? null,
    expectedOutput: settings.preferredFormat,
    cookiesHint: result.cookieHint,
    error: null,
  };
}

export function validateUrl(rawUrl: string): string {
  try {
    const parsedUrl = new URL(rawUrl.trim());

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Nur http:// und https:// Links werden unterstuetzt.");
    }

    return parsedUrl.toString();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Nur ")) {
      throw error;
    }

    throw new Error("Bitte gib einen gueltigen http:// oder https:// Link ein.");
  }
}

export function cleanAnalysisUrl(rawUrl: string): string {
  const parsedUrl = new URL(rawUrl);

  if (!isInstagramUrl(parsedUrl)) {
    return parsedUrl.toString();
  }

  parsedUrl.hash = "";

  for (const key of Array.from(parsedUrl.searchParams.keys())) {
    if (instagramTrackingParams.has(key) || key.startsWith("utm_")) {
      parsedUrl.searchParams.delete(key);
    }
  }

  return parsedUrl.toString();
}

export function isInstagramUrl(parsedUrl: URL): boolean {
  const hostParts = parsedUrl.hostname.toLowerCase().split(".");
  return hostParts.slice(-2).join(".") === "instagram.com";
}

export async function resolveYtDlpPath(settings: AppSettings, projectRoot: string): Promise<YtDlpCommand> {
  if (settings.ytDlpPath) {
    if (await fileExists(settings.ytDlpPath)) {
      return {
        command: settings.ytDlpPath,
        label: "Einstellungen",
      };
    }

    throw new Error("Der in den Einstellungen gespeicherte yt-dlp-Pfad wurde nicht gefunden.");
  }

  const referencePath = path.join(projectRoot, "reference", "Windows", "yt-dlp.exe");

  if (process.platform === "win32" && await fileExists(referencePath)) {
    return {
      command: referencePath,
      label: "reference/Windows/yt-dlp.exe",
    };
  }

  return {
    command: process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
    label: "PATH",
  };
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function runYtDlpMetadata(
  ytDlp: YtDlpCommand,
  url: string,
  settings: AppSettings,
  projectRoot: string,
): Promise<{ metadata: YtDlpMetadata; cookieHint: string }> {
  const attempts = await buildAuthAttempts(url, settings, projectRoot);
  const failures: string[] = [];

  for (const attempt of attempts) {
    const args = [
      ...attempt.args,
      "--dump-json",
      "--no-playlist",
      "--skip-download",
      url,
    ];

    console.log(`yt-dlp Analyse-Versuch: ${attempt.label}; yt-dlp: ${ytDlp.label}`);

    try {
      const output = await spawnForText(ytDlp.command, args);

      try {
        return {
          metadata: JSON.parse(output) as YtDlpMetadata,
          cookieHint: `Verwendet: ${attempt.label}; yt-dlp: ${ytDlp.label}`,
        };
      } catch {
        throw new Error("yt-dlp hat keine lesbaren Metadaten zurueckgegeben.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      failures.push(`${attempt.label}: ${message}`);
      console.warn(`yt-dlp Analyse-Versuch fehlgeschlagen (${attempt.label})`, error);
    }
  }

  throw new Error(formatAnalysisFailure(url, failures));
}

export async function buildAuthAttempts(
  url: string,
  settings: AppSettings,
  projectRoot: string,
): Promise<AuthAttempt[]> {
  const parsedUrl = new URL(url);

  if (!isInstagramUrl(parsedUrl)) {
    return [{ label: "ohne Cookies", args: [] }];
  }

  if (settings.cookieMode === "none") {
    return [{ label: "ohne Cookies", args: [] }];
  }

  if (settings.cookieMode === "file") {
    const cookiesPath = path.join(projectRoot, "reference", "Windows", "cookies.txt");

    if (await fileExists(cookiesPath)) {
      return [{ label: "cookies.txt", args: ["--cookies", cookiesPath] }];
    }

    return [{ label: "cookies.txt fehlt, ohne Cookies", args: [] }];
  }

  return resolveBrowserAttempts(settings.browser);
}

function resolveBrowserAttempts(browserSetting: string): AuthAttempt[] {
  const normalizedBrowser = browserSetting.trim().toLowerCase();

  if (!normalizedBrowser || normalizedBrowser === "automatisch" || normalizedBrowser === "auto") {
    const browsers = process.platform === "darwin"
      ? ["chrome", "edge", "firefox", "brave", "safari", "opera"]
      : ["chrome", "edge", "firefox", "brave", "opera"];

    return browsers.map((browser) => ({
      label: `Browser-Cookies (${browser})`,
      args: ["--cookies-from-browser", browser],
    }));
  }

  const browserAliases = new Map([
    ["google chrome", "chrome"],
    ["microsoft edge", "edge"],
    ["brave browser", "brave"],
  ]);
  const browser = browserAliases.get(normalizedBrowser) ?? normalizedBrowser;

  return [{
    label: `Browser-Cookies (${browser})`,
    args: ["--cookies-from-browser", browser],
  }];
}

export function spawnForText(command: string, args: string[], timeoutMs = analysisTimeoutMs): Promise<string> {
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
    }, timeoutMs);

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

function formatAnalysisFailure(url: string, failures: string[]): string {
  const parsedUrl = new URL(url);

  if (isInstagramUrl(parsedUrl)) {
    const attempts = failures.length > 0
      ? ` Versucht wurde: ${failures.map((failure) => failure.split(":")[0]).join(", ")}.`
      : "";

    return `Instagram verlangt vermutlich Browser-Cookies. Bitte sicherstellen, dass der Beitrag im gewaehlten Browser geoeffnet werden kann.${attempts}`;
  }

  return failures.at(-1) ?? "Link-Analyse fehlgeschlagen. yt-dlp konnte keine Metadaten lesen.";
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
