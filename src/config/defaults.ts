import type { AppSettings, DownloadProgress, LinkDetails } from "../types/app";

export const APP_NAME = "Nelly Downloader";

export const DEFAULT_SETTINGS: AppSettings = {
  targetFolder: "C:\\Users\\Public\\Videos\\NellyDownloads",
  preferredFormat: "MP4, H.264 bevorzugt",
  whatsappCompatibleOutput: true,
  downloadMode: "auto",
  whatsappCompatibilityMode: "auto",
  cookieMode: "auto",
  browser: "Automatisch",
  ytDlpPath: null,
  ffmpegPath: null,
  ffprobePath: null,
};

export const EMPTY_LINK_DETAILS: LinkDetails = {
  platform: "Noch nicht analysiert",
  title: "-",
  creator: "-",
  videoId: "-",
  duration: "-",
  thumbnailLabel: "Vorschau",
  thumbnailUrl: null,
  expectedOutput: DEFAULT_SETTINGS.preferredFormat,
  cookiesHint: "Wird später bei der Link-Analyse erkannt",
  error: null,
};

export const IDLE_PROGRESS: DownloadProgress = {
  total: 0,
  download: 0,
  conversion: 0,
  status: "Wartet auf Eingabe",
};
