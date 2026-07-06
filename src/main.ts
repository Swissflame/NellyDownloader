import { renderApp, bindApp } from "./components/app";
import { showDialog } from "./components/dialog";
import { DEFAULT_SETTINGS } from "./config/defaults";
import { initialState } from "./data/demoState";
import type { AppSettings, AppState, TargetFolderState } from "./types/app";
import type { ElectronApi } from "./types/electronApi";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App-Container wurde nicht gefunden.");
}

const appElement = app;
const fallbackApi = createFallbackApi();
const localApi = window.nelly ?? fallbackApi;
let state: AppState = {
  ...initialState,
  settings: DEFAULT_SETTINGS,
};

render();
void initializeApp();

function render(): void {
  appElement.innerHTML = renderApp(state);
  bindApp();
}

async function initializeApp(): Promise<void> {
  try {
    state = {
      ...state,
      settings: await localApi.getSettings(),
    };
    render();
    await refreshTargetFolder();
  } catch (error) {
    showDialog({
      title: "Startfehler",
      text: error instanceof Error ? error.message : "Die App-Daten konnten nicht geladen werden.",
    });
  }
}

async function refreshTargetFolder(): Promise<void> {
  state = {
    ...state,
    targetFolder: {
      files: [],
      folderExists: true,
      message: "Zielordner wird geladen.",
    },
  };
  render();

  try {
    state = {
      ...state,
      targetFolder: await localApi.listTargetFolder(),
    };
  } catch (error) {
    state = {
      ...state,
      targetFolder: {
        files: [],
        folderExists: false,
        message: error instanceof Error ? error.message : "Der Zielordner konnte nicht gelesen werden.",
      },
    };
  }

  render();
}

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;

  if (!action) {
    return;
  }

  void handleAction(action);
});

async function handleAction(action: string): Promise<void> {
  switch (action) {
    case "settings":
      state = { ...state, settingsVisible: true };
      render();
      return;
    case "close-settings":
      state = { ...state, settingsVisible: false };
      render();
      return;
    case "select-target-folder":
      await selectTargetFolder();
      return;
    case "refresh":
      await refreshTargetFolder();
      return;
    case "copy":
      await showFileActionPlaceholder("copy");
      return;
    case "delete":
      await showFileActionPlaceholder("delete");
      return;
    case "help":
      showDialog({
        title: "Hilfe",
        text: "Das Hilfe-System wird in einem späteren Schritt umgesetzt.",
      });
      return;
    default:
      showDialog({
        title: "Hinweis",
        text: "Diese Funktion wird später umgesetzt.",
      });
  }
}

async function selectTargetFolder(): Promise<void> {
  try {
    const result = await localApi.selectTargetFolder();

    if (result.canceled) {
      showDialog({
        title: "Zielordner",
        text: result.message,
      });
      return;
    }

    state = {
      ...state,
      settings: result.settings,
      settingsVisible: true,
    };
    render();
    await refreshTargetFolder();

    showDialog({
      title: "Zielordner gespeichert",
      text: result.path ? `Der Zielordner wurde gespeichert: ${result.path}` : result.message,
    });
  } catch (error) {
    showDialog({
      title: "Zielordner",
      text: error instanceof Error ? error.message : "Der Zielordner konnte nicht ausgewählt werden.",
    });
  }
}

async function showFileActionPlaceholder(action: "copy" | "delete"): Promise<void> {
  const selectedFileIds = getSelectedFileIds();
  const result = action === "copy"
    ? await localApi.copySelectedFiles(selectedFileIds)
    : await localApi.deleteSelectedFiles(selectedFileIds);

  showDialog({
    title: action === "copy" ? "Kopieren" : "Löschen",
    text: result.message,
  });
}

function getSelectedFileIds(): string[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>("[data-file-id]:checked"))
    .map((checkbox) => checkbox.dataset.fileId)
    .filter((fileId): fileId is string => typeof fileId === "string");
}

document.addEventListener("nelly:placeholder-action", (event) => {
  const placeholderEvent = event as CustomEvent<{ action: string }>;
  const status = document.querySelector<HTMLElement>("[data-status]");

  if (placeholderEvent.detail.action === "download" && status) {
    status.textContent = "Download-Funktion noch nicht eingebaut";
  }

  showDialog({
    title: "Download noch nicht aktiv",
    text: "Das Grundgerüst startet bereits. Die echte Download-Funktion folgt in einem späteren Schritt.",
  });
});

function createFallbackApi(): ElectronApi {
  let memorySettings: AppSettings = DEFAULT_SETTINGS;
  const emptyFolder: TargetFolderState = {
    files: [],
    folderExists: true,
    message: "Der Zielordner wird nur in der Electron-App lokal gelesen.",
  };

  return {
    getAppVersion: async () => "dev",
    getSettings: async () => memorySettings,
    saveSettings: async (settings) => {
      memorySettings = settings;
      return {
        saved: true,
        settings: memorySettings,
        message: "Einstellungen wurden nur im Browser-Speicher dieser Sitzung gemerkt.",
      };
    },
    selectTargetFolder: async () => ({
      canceled: true,
      path: null,
      settings: memorySettings,
      message: "Die native Ordnerauswahl ist nur in der Electron-App verfügbar.",
    }),
    listTargetFolder: async () => emptyFolder,
    copySelectedFiles: async (fileIds) => ({
      copied: false,
      fileIds,
      message: "Kopieren ist noch deaktiviert und führt keine Dateiaktion aus.",
    }),
    deleteSelectedFiles: async (fileIds) => ({
      deleted: false,
      fileIds,
      message: "Löschen ist noch deaktiviert und führt keine Dateiaktion aus.",
    }),
    analyzeLink: async (url) => ({
      url,
      platform: "Noch nicht analysiert",
      title: "-",
      creator: "-",
      videoId: "-",
      duration: "-",
      thumbnailLabel: "Vorschau",
      expectedOutput: "MP4, H.264 bevorzugt",
      cookiesHint: "Analyse ist vorbereitet, ruft aber noch kein yt-dlp auf.",
    }),
    startDownload: async (url) => ({
      started: false,
      url,
      message: "Download ist vorbereitet, ruft aber noch keine externen Tools auf.",
    }),
  };
}
