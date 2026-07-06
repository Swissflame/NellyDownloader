export type LinkDetails = {
  platform: string;
  title: string;
  creator: string;
  videoId: string;
  duration: string;
  thumbnailLabel: string;
  expectedOutput: string;
  cookiesHint: string;
};

export type DownloadProgress = {
  total: number;
  download: number;
  conversion: number;
  status: string;
};

export type OutputFile = {
  id: string;
  name: string;
  size: string;
  date: string;
  type: string;
  selected: boolean;
};

export type TargetFolderState = {
  files: OutputFile[];
  message: string | null;
  folderExists: boolean;
};

export type CookieMode = "auto" | "browser" | "file" | "none";

export type AppSettings = {
  targetFolder: string;
  preferredFormat: string;
  whatsappCompatibleOutput: boolean;
  cookieMode: CookieMode;
  browser: string;
};

export type AppState = {
  linkInput: string;
  linkDetails: LinkDetails;
  progress: DownloadProgress;
  targetFolder: TargetFolderState;
  settings: AppSettings;
  settingsVisible: boolean;
};

export type DialogMessage = {
  title: string;
  text: string;
};
