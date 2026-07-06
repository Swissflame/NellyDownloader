import { DEFAULT_SETTINGS, EMPTY_LINK_DETAILS, IDLE_PROGRESS } from "../config/defaults";
import type { AppState } from "../types/app";

export const initialState: AppState = {
  linkInput: "",
  linkDetails: EMPTY_LINK_DETAILS,
  progress: IDLE_PROGRESS,
  targetFolder: {
    files: [],
    message: "Zielordner wird geladen.",
    folderExists: true,
  },
  settings: DEFAULT_SETTINGS,
  settingsVisible: false,
  analysisInProgress: false,
  downloadInProgress: false,
};
