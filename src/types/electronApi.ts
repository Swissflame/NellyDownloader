import type { AppSettings, DownloadProgressEvent, LinkDetails, TargetFolderState } from "./app";

export type PlaceholderResult = {
  message: string;
};

export type SaveSettingsResult = PlaceholderResult & {
  saved: boolean;
  settings: AppSettings;
};

export type SelectTargetFolderResult = PlaceholderResult & {
  canceled: boolean;
  path: string | null;
  settings: AppSettings;
};

export type FileActionResult = PlaceholderResult & {
  copied?: boolean;
  deleted?: boolean;
  opened?: boolean;
  revealed?: boolean;
  fileIds: string[];
  mode?: "files" | "paths";
  movedCount?: number;
  failedCount?: number;
};

export type OpenTargetFolderResult = PlaceholderResult & {
  opened: boolean;
};

export type StartDownloadResult = PlaceholderResult & {
  started: boolean;
  url: string;
  outputPath: string | null;
};

export type AnalyzeLinkResult = LinkDetails & {
  url: string;
};

export type ElectronApi = {
  getAppVersion: () => Promise<string>;
  readClipboardText: () => Promise<string>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<SaveSettingsResult>;
  selectTargetFolder: () => Promise<SelectTargetFolderResult>;
  listTargetFolder: () => Promise<TargetFolderState>;
  openTargetFolder: () => Promise<OpenTargetFolderResult>;
  revealSelectedFile: (fileId: string) => Promise<FileActionResult>;
  copySelectedFiles: (fileIds: string[]) => Promise<FileActionResult>;
  deleteSelectedFiles: (fileIds: string[]) => Promise<FileActionResult>;
  analyzeLink: (url: string) => Promise<AnalyzeLinkResult>;
  startDownload: (url: string) => Promise<StartDownloadResult>;
  onDownloadProgress: (callback: (event: DownloadProgressEvent) => void) => () => void;
};
