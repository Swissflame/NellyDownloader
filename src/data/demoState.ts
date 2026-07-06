import { DEFAULT_SETTINGS, EMPTY_LINK_DETAILS, IDLE_PROGRESS } from "../config/defaults";
import type { AppState, OutputFile } from "../types/app";

export const DEMO_OUTPUT_FILES: OutputFile[] = [
  {
    id: "video-1",
    name: "Beispielvideo_Instagram_2026-07-06.mp4",
    size: "12 MB",
    date: "06.07.2026",
    type: "MP4",
    selected: true,
  },
  {
    id: "video-2",
    name: "Schulprojekt_YouTube_Ausschnitt.mp4",
    size: "18 MB",
    date: "05.07.2026",
    type: "MP4",
    selected: false,
  },
  {
    id: "audio-1",
    name: "Interview_TikTok_Audio.m4a",
    size: "4 MB",
    date: "04.07.2026",
    type: "Audio",
    selected: false,
  },
];

export const initialState: AppState = {
  linkInput: "",
  linkDetails: EMPTY_LINK_DETAILS,
  progress: IDLE_PROGRESS,
  outputFiles: DEMO_OUTPUT_FILES,
  settings: DEFAULT_SETTINGS,
};
