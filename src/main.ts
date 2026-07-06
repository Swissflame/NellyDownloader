import { renderApp, bindApp } from "./components/app";
import { showConfirmDialog, showDialog } from "./components/dialog";
import { DEFAULT_SETTINGS, EMPTY_LINK_DETAILS } from "./config/defaults";
import { initialState } from "./data/demoState";
import type {
  AppSettings,
  AppState,
  DownloadMode,
  DownloadProgressEvent,
  OriginalAfterConversionMode,
  TargetFolderState,
  WhatsAppCompatibilityMode,
} from "./types/app";
import type { AnalyzeLinkResult, ElectronApi } from "./types/electronApi";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App-Container wurde nicht gefunden.");
}

const appElement = app;
const fallbackApi = createFallbackApi();
const localApi = window.nelly ?? fallbackApi;
let toastTimeout: number | undefined;
let state: AppState = {
  ...initialState,
  settings: DEFAULT_SETTINGS,
};

render();
localApi.onDownloadProgress((progress) => {
  applyDownloadProgress(progress);
});
void initializeApp();

function render(): void {
  appElement.innerHTML = renderApp(state);
  bindApp();
}

async function initializeApp(): Promise<void> {
  try {
    const [settings, appVersion] = await Promise.all([
      localApi.getSettings(),
      localApi.getAppVersion(),
    ]);

    state = {
      ...state,
      settings,
      appVersion,
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

document.addEventListener("change", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  const field = target.dataset.settingsField;

  if (field === "downloadMode") {
    state = {
      ...state,
      settings: {
        ...state.settings,
        downloadMode: target.value as DownloadMode,
      },
    };
    return;
  }

  if (field === "whatsappCompatibilityMode") {
    state = {
      ...state,
      settings: {
        ...state.settings,
        whatsappCompatibilityMode: target.value as WhatsAppCompatibilityMode,
      },
    };
    return;
  }

  if (field === "originalAfterConversionMode") {
    state = {
      ...state,
      settings: {
        ...state.settings,
        originalAfterConversionMode: target.value as OriginalAfterConversionMode,
      },
    };
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement) || !target.matches("[data-help-search]")) {
    return;
  }

  state = {
    ...state,
    helpSearch: target.value,
  };
  render();
  const nextSearchInput = document.querySelector<HTMLInputElement>("[data-help-search]");
  nextSearchInput?.focus();
  nextSearchInput?.setSelectionRange(nextSearchInput.value.length, nextSearchInput.value.length);
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
    case "save-settings":
      await saveCurrentSettings();
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
      state = { ...state, helpVisible: true };
      render();
      return;
    case "close-help":
      state = { ...state, helpVisible: false, helpSearch: "" };
      render();
      return;
    case "about":
      state = { ...state, aboutVisible: true };
      render();
      return;
    case "close-about":
      state = { ...state, aboutVisible: false };
      render();
      return;
    default:
      showDialog({
        title: "Hinweis",
        text: "Diese Funktion wird später umgesetzt.",
      });
  }
}

async function saveCurrentSettings(): Promise<void> {
  try {
    const result = await localApi.saveSettings(state.settings);

    state = {
      ...state,
      settings: result.settings,
      settingsVisible: true,
    };
    render();

    showDialog({
      title: "Einstellungen gespeichert",
      text: result.message,
    });
  } catch (error) {
    showDialog({
      title: "Einstellungen",
      text: error instanceof Error ? error.message : "Die Einstellungen konnten nicht gespeichert werden.",
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
  try {
    const selectedFileIds = getSelectedFileIds();

    if (action === "copy") {
      const result = await localApi.copySelectedFiles(selectedFileIds);
      showToast(result.message);
      return;
    }

    await confirmAndTrashSelectedFiles(selectedFileIds);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Die Dateiaktion ist fehlgeschlagen.";

    if (action === "copy") {
      showToast(message);
      return;
    }

    showDialog({
      title: "Löschen",
      text: message,
    });
  }
}

async function confirmAndTrashSelectedFiles(selectedFileIds: string[]): Promise<void> {
  if (selectedFileIds.length === 0) {
    showToast("Bitte zuerst mindestens eine Datei auswählen.");
    return;
  }

  const confirmed = await showConfirmDialog({
    title: "In Papierkorb verschieben",
    text: selectedFileIds.length === 1
      ? "1 Datei in den Papierkorb verschieben?"
      : `${selectedFileIds.length} Dateien in den Papierkorb verschieben?`,
    confirmText: "In Papierkorb verschieben",
    cancelText: "Abbrechen",
    danger: true,
  });

  if (!confirmed) {
    return;
  }

  const result = await localApi.deleteSelectedFiles(selectedFileIds);
  await refreshTargetFolder();
  showToast(result.message);
}

function showToast(message: string): void {
  let toast = document.querySelector<HTMLDivElement>("[data-toast]");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-message";
    toast.dataset.toast = "true";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }

  toast.textContent = message;
  toast.hidden = false;

  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
  }

  toastTimeout = window.setTimeout(() => {
    if (toast) {
      toast.hidden = true;
    }
  }, 3_000);
}

function getSelectedFileIds(): string[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>("[data-file-id]:checked"))
    .map((checkbox) => checkbox.dataset.fileId)
    .filter((fileId): fileId is string => typeof fileId === "string");
}

document.addEventListener("nelly:placeholder-action", (event) => {
  const placeholderEvent = event as CustomEvent<{ action: string; url?: string }>;

  if (placeholderEvent.detail.action === "download") {
    void startDownloadWorkflow(placeholderEvent.detail.url ?? "");
    return;
  }

  if (placeholderEvent.detail.action === "download-from-clipboard") {
    void startDownloadFromClipboard();
  }
});

async function startDownloadFromClipboard(): Promise<void> {
  try {
    const clipboardText = await localApi.readClipboardText();
    const url = findFirstValidHttpUrl(clipboardText);

    if (!url) {
      showToast("Keine gültige URL in der Zwischenablage.");
      return;
    }

    state = {
      ...state,
      linkInput: url,
    };
    render();
    showToast("Link aus Zwischenablage übernommen.");
    await startDownloadWorkflow(url);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Zwischenablage konnte nicht gelesen werden.");
  }
}

function findFirstValidHttpUrl(clipboardText: string): string | null {
  const candidates = clipboardText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);

      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.toString();
      }
    } catch {
      // Try the next line.
    }
  }

  return null;
}

async function analyzeLink(url: string): Promise<AnalyzeLinkResult | null> {
  const trimmedUrl = url.trim();
  console.log("Analyse gestartet", trimmedUrl);

  state = {
    ...state,
    linkInput: trimmedUrl,
    analysisInProgress: true,
    progress: {
      ...state.progress,
      total: 0,
      download: 0,
      conversion: 0,
      status: "Link wird analysiert...",
    },
    linkDetails: {
      ...EMPTY_LINK_DETAILS,
      platform: "Analysiere...",
      cookiesHint: "yt-dlp liest gerade nur Metadaten. Es wird nichts heruntergeladen.",
    },
  };
  render();

  try {
    const details = await localApi.analyzeLink(trimmedUrl);

    state = {
      ...state,
      linkInput: details.url,
      linkDetails: details,
      analysisInProgress: false,
      progress: {
        ...state.progress,
        status: "Analyse abgeschlossen",
      },
    };
    render();
    return details;
  } catch (error) {
    state = {
      ...state,
      analysisInProgress: false,
      linkDetails: {
        ...EMPTY_LINK_DETAILS,
        error: error instanceof Error ? error.message : "Die Link-Analyse ist fehlgeschlagen.",
      },
      progress: {
        ...state.progress,
        status: "Analyse fehlgeschlagen",
      },
    };
  }

  render();
  return null;
}

async function startDownloadWorkflow(url: string): Promise<void> {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    state = {
      ...state,
      linkDetails: {
        ...EMPTY_LINK_DETAILS,
        error: "Bitte gib zuerst einen Link ein.",
      },
      progress: {
        total: 0,
        download: 0,
        conversion: 0,
        status: "Wartet auf gueltigen Link",
      },
    };
    render();
    return;
  }

  state = {
    ...state,
    downloadInProgress: true,
  };
  render();

  const analyzedForCurrentLink = state.linkInput === trimmedUrl
    && state.linkDetails.error === null
    && state.linkDetails.platform !== EMPTY_LINK_DETAILS.platform
    && state.linkDetails.platform !== "Analysiere...";
  const shouldAnalyzeBeforeDownload = state.settings.downloadMode === "analyze-first"
    || (state.settings.downloadMode === "auto" && analyzedForCurrentLink);

  let downloadUrl = trimmedUrl;

  if (shouldAnalyzeBeforeDownload && !analyzedForCurrentLink) {
    const details = await analyzeLink(trimmedUrl);

    if (!details) {
      state = {
        ...state,
        downloadInProgress: false,
      };
      render();
      return;
    }

    downloadUrl = details.url;
  }

  if (!downloadUrl) {
    state = {
      ...state,
      downloadInProgress: false,
    };
    render();
    return;
  }

  state = {
    ...state,
    downloadInProgress: true,
    analysisInProgress: false,
    progress: {
      total: 0,
      download: 0,
      conversion: 0,
      status: "Download laeuft...",
    },
  };
  render();

  try {
    const result = await localApi.startDownload(downloadUrl);

    state = {
      ...state,
      downloadInProgress: false,
      progress: {
        total: 100,
        download: 100,
        conversion: 0,
        status: result.message,
      },
      linkDetails: {
        ...(analyzedForCurrentLink ? state.linkDetails : {
          ...EMPTY_LINK_DETAILS,
          platform: "Direkt heruntergeladen",
          title: result.outputPath ? getFileName(result.outputPath) : "-",
          videoId: result.outputPath ? getVideoIdFromFileName(result.outputPath) : "-",
          expectedOutput: state.settings.preferredFormat,
          cookiesHint: "Metadaten wurden im Downloadprozess verarbeitet.",
        }),
        error: null,
      },
    };
    render();
    await refreshTargetFolder();
  } catch (error) {
    state = {
      ...state,
      downloadInProgress: false,
      progress: {
        total: 0,
        download: 0,
        conversion: 0,
        status: "Download fehlgeschlagen",
      },
      linkDetails: {
        ...state.linkDetails,
        error: error instanceof Error ? error.message : "Der Download ist fehlgeschlagen.",
      },
    };
    render();
  }
}

function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

function getVideoIdFromFileName(filePath: string): string {
  const match = getFileName(filePath).match(/\[([^\]]+)]/);
  return match?.[1] ?? "-";
}

function applyDownloadProgress(progress: DownloadProgressEvent): void {
  state = {
    ...state,
    progress: {
      total: progress.total,
      download: progress.download,
      conversion: progress.conversion,
      status: progress.status,
    },
  };
  render();
}

function createFallbackApi(): ElectronApi {
  let memorySettings: AppSettings = DEFAULT_SETTINGS;
  const emptyFolder: TargetFolderState = {
    files: [],
    folderExists: true,
    message: "Der Zielordner wird nur in der Electron-App lokal gelesen.",
  };

  return {
    getAppVersion: async () => "dev",
    readClipboardText: async () => navigator.clipboard?.readText?.() ?? "",
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
      platform: "Browser-Vorschau",
      title: "-",
      creator: "-",
      videoId: "-",
      duration: "-",
      thumbnailLabel: "Vorschau",
      thumbnailUrl: null,
      expectedOutput: "MP4, H.264 bevorzugt",
      cookiesHint: "Die echte yt-dlp-Analyse ist nur in der Electron-App verfügbar.",
      error: null,
    }),
    startDownload: async (url) => ({
      started: false,
      url,
      outputPath: null,
      message: "Der echte Download ist nur in der Electron-App verfuegbar.",
    }),
    onDownloadProgress: () => () => undefined,
  };
}
