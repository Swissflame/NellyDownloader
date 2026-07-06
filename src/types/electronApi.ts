import type { AppSettings, LinkDetails, TargetFolderState } from "./app";

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
  fileIds: string[];
};

export type StartDownloadResult = PlaceholderResult & {
  started: boolean;
  url: string;
};

export type AnalyzeLinkResult = LinkDetails & {
  url: string;
};

export type ElectronApi = {
  getAppVersion: () => Promise<string>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<SaveSettingsResult>;
  selectTargetFolder: () => Promise<SelectTargetFolderResult>;
  listTargetFolder: () => Promise<TargetFolderState>;
  copySelectedFiles: (fileIds: string[]) => Promise<FileActionResult>;
  deleteSelectedFiles: (fileIds: string[]) => Promise<FileActionResult>;
  analyzeLink: (url: string) => Promise<AnalyzeLinkResult>;
  startDownload: (url: string) => Promise<StartDownloadResult>;
};
