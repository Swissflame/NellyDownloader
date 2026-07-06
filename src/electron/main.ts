import { app, BrowserWindow, dialog, ipcMain } from "electron/main";
import type { BrowserWindow as BrowserWindowInstance, OpenDialogOptions } from "electron/main";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AppSettings, DownloadProgressEvent, OutputFile, TargetFolderState } from "../types/app";
import { copyTargetFilesToClipboard } from "./fileClipboard";
import { moveTargetFilesToTrash } from "./fileTrash";
import { analyzeLinkWithYtDlp } from "./ytDlpAnalysis";
import { downloadLinkWithYtDlp } from "./ytDlpDownload";

const devServerUrl = process.env.NELLY_ELECTRON_DEV_URL;
const isSmokeTest = process.env.NELLY_ELECTRON_SMOKE_TEST === "1";
const smokeTestTargetFolder = process.env.NELLY_ELECTRON_TEST_TARGET_FOLDER;
const smokeTestUserData = process.env.NELLY_ELECTRON_TEST_USER_DATA;
const smokeTestAnalyzeUrl = process.env.NELLY_ELECTRON_TEST_ANALYZE_URL;
const smokeTestDownloadUrl = process.env.NELLY_ELECTRON_TEST_DOWNLOAD_URL;
const smokeTestCopy = process.env.NELLY_ELECTRON_TEST_COPY === "1";
const smokeTestSettings = process.env.NELLY_ELECTRON_TEST_SETTINGS === "1";
const smokeTestTrash = process.env.NELLY_ELECTRON_TEST_TRASH === "1";
const smokeTestHelp = process.env.NELLY_ELECTRON_TEST_HELP === "1";
const supportedExtensions = new Set(["mp4", "mkv", "webm", "mov", "avi", "mp3", "m4a", "wav", "opus"]);
const projectRoot = path.resolve(__dirname, "..", "..", "..");

if (smokeTestUserData) {
  app.setPath("userData", smokeTestUserData);
}

let mainWindow: BrowserWindowInstance | null = null;
let downloadRunning = false;

function getDefaultSettings(): AppSettings {
  return {
    targetFolder: path.join(app.getPath("videos"), "NellyDownloads"),
    preferredFormat: "MP4, H.264 bevorzugt",
    whatsappCompatibleOutput: true,
    downloadMode: "auto",
    whatsappCompatibilityMode: "auto",
    originalAfterConversionMode: "keep",
    cookieMode: "auto",
    browser: "Automatisch",
    ytDlpPath: null,
    ffmpegPath: null,
    ffprobePath: null,
  };
}

function getSettingsPath(): string {
  return path.join(app.getPath("userData"), "settings.json");
}

async function readSettings(): Promise<AppSettings> {
  const defaults = getDefaultSettings();

  try {
    const rawSettings = await fs.readFile(getSettingsPath(), "utf-8");
    const parsedSettings = JSON.parse(rawSettings.replace(/^\uFEFF/, "")) as Partial<AppSettings>;

    return {
      ...defaults,
      ...parsedSettings,
      targetFolder: typeof parsedSettings.targetFolder === "string" && parsedSettings.targetFolder.trim()
        ? parsedSettings.targetFolder
        : defaults.targetFolder,
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return defaults;
    }

    console.error("Einstellungen konnten nicht gelesen werden.", error);
    return defaults;
  }
}

async function writeSettings(settings: AppSettings): Promise<AppSettings> {
  const normalizedSettings: AppSettings = {
    ...getDefaultSettings(),
    ...settings,
  };

  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(getSettingsPath(), JSON.stringify(normalizedSettings, null, 2), "utf-8");

  return normalizedSettings;
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 860,
    minHeight: 640,
    title: "Nelly Downloader",
    backgroundColor: "#101114",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
  }

  mainWindow.webContents.once("did-finish-load", () => {
    if (isSmokeTest) {
      void runSmokeTest();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function runSmokeTest(): Promise<void> {
  if (!mainWindow) {
    app.exit(1);
    return;
  }

  const testScript = smokeTestTargetFolder
    ? `
      (async () => {
        for (let attempt = 0; attempt < 100; attempt += 1) {
          if (typeof window.nelly === 'object' && document.querySelector('[data-action="settings"]')) break;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        const apiReady = typeof window.nelly === 'object' && typeof window.nelly.getAppVersion === 'function';
        if (!apiReady) return false;
        document.querySelector('[data-action="settings"]')?.click();
        const settingsPanel = document.querySelector('[data-settings-panel]');
        const settingsPanelVisible = settingsPanel instanceof HTMLElement && !settingsPanel.hidden;
        const settings = await window.nelly.getSettings();
        const saved = await window.nelly.saveSettings({ ...settings, targetFolder: ${JSON.stringify(smokeTestTargetFolder)} });
        const reloadedSettings = await window.nelly.getSettings();
        const folder = await window.nelly.listTargetFolder();
        let analysisReady = true;
        let downloadReady = true;
        let copyReady = true;
        let settingsReady = true;
        let trashReady = true;
        let helpReady = true;
        if (${JSON.stringify(smokeTestSettings)}) {
          const changedSettings = await window.nelly.saveSettings({
            ...reloadedSettings,
            downloadMode: 'direct',
            whatsappCompatibilityMode: 'never',
            originalAfterConversionMode: 'trash'
          });
          const checkedSettings = await window.nelly.getSettings();
          settingsReady = changedSettings.saved === true
            && checkedSettings.downloadMode === 'direct'
            && checkedSettings.whatsappCompatibilityMode === 'never'
            && checkedSettings.originalAfterConversionMode === 'trash';
        }
        if (${JSON.stringify(Boolean(smokeTestAnalyzeUrl))}) {
          document.querySelector('[data-action="close-settings"]')?.click();
          const input = document.querySelector('#download-link');
          if (!(input instanceof HTMLInputElement)) return false;
          input.value = ${JSON.stringify(smokeTestAnalyzeUrl ?? "")};
          const details = await window.nelly.analyzeLink(${JSON.stringify(smokeTestAnalyzeUrl ?? "")});
          analysisReady = details.title.includes('Rick Astley') || details.platform.includes('Youtube');
        }
        if (${JSON.stringify(Boolean(smokeTestDownloadUrl))}) {
          document.querySelector('[data-action="close-settings"]')?.click();
          const beforeDownload = await window.nelly.listTargetFolder();
          const input = document.querySelector('#download-link');
          if (!(input instanceof HTMLInputElement)) return false;
          input.value = ${JSON.stringify(smokeTestDownloadUrl ?? "")};
          document.querySelector('.link-form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          for (let attempt = 0; attempt < 360; attempt += 1) {
            const statusText = document.querySelector('[data-status]')?.textContent ?? '';
            if (statusText.includes('Download abgeschlossen')
              || statusText.includes('Umwandlung abgeschlossen')
              || statusText.includes('Originaldatei wurde in den Papierkorb verschoben')
              || statusText.includes('Download fehlgeschlagen')) break;
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          const afterDownload = await window.nelly.listTargetFolder();
          const statusText = document.querySelector('[data-status]')?.textContent ?? '';
          downloadReady = (statusText.includes('Download abgeschlossen')
              || statusText.includes('Umwandlung abgeschlossen')
              || statusText.includes('Originaldatei wurde in den Papierkorb verschoben'))
            && afterDownload.files.length > beforeDownload.files.length;
        }
        if (${JSON.stringify(smokeTestCopy)}) {
          const noSelection = await window.nelly.copySelectedFiles([]);
          const refreshedFolder = await window.nelly.listTargetFolder();
          const ids = refreshedFolder.files.slice(0, 2).map((file) => file.id);
          const oneFile = await window.nelly.copySelectedFiles(ids.slice(0, 1));
          const multipleFiles = await window.nelly.copySelectedFiles(ids);
          copyReady = noSelection.copied === false
            && oneFile.copied === true
            && multipleFiles.copied === true
            && (navigator.platform.toLowerCase().includes('win') ? oneFile.mode === 'files' && multipleFiles.mode === 'files' : true)
            && ids.length >= 2;
        }
        if (${JSON.stringify(smokeTestTrash)}) {
          document.querySelector('[data-action="close-settings"]')?.click();
          await new Promise((resolve) => setTimeout(resolve, 150));
          const beforeTrash = await window.nelly.listTargetFolder();
          document.querySelector('[data-action="delete"]')?.click();
          await new Promise((resolve) => setTimeout(resolve, 150));
          const noSelectionToast = document.querySelector('[data-toast]')?.textContent ?? '';

          const firstCheckbox = document.querySelector('[data-file-id]');
          if (firstCheckbox instanceof HTMLInputElement) firstCheckbox.checked = true;
          document.querySelector('[data-action="delete"]')?.click();
          await new Promise((resolve) => setTimeout(resolve, 150));
          document.querySelector('[data-confirm-cancel]')?.click();
          await new Promise((resolve) => setTimeout(resolve, 150));
          const afterCancel = await window.nelly.listTargetFolder();

          const ids = beforeTrash.files.map((file) => file.id);
          const oneFile = await window.nelly.deleteSelectedFiles(ids.slice(0, 1));
          const afterOneTrash = await window.nelly.listTargetFolder();

          const multipleFiles = await window.nelly.deleteSelectedFiles(ids.slice(1));
          const afterMultipleTrash = await window.nelly.listTargetFolder();

          trashReady = noSelectionToast.includes('Bitte zuerst mindestens eine Datei')
            && afterCancel.files.length === beforeTrash.files.length
            && oneFile.deleted === true
            && oneFile.movedCount === 1
            && multipleFiles.deleted === true
            && multipleFiles.movedCount === beforeTrash.files.length - 1
            && afterOneTrash.files.length === beforeTrash.files.length - 1
            && afterMultipleTrash.files.length === 0
            && beforeTrash.files.length >= 3;
        }
        if (${JSON.stringify(smokeTestHelp)}) {
          document.querySelector('[data-action="close-settings"]')?.click();
          for (let attempt = 0; attempt < 40; attempt += 1) {
            if (!document.querySelector('[data-settings-panel]')) break;
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          document.querySelector('.topnav [data-action="help"]')?.click();
          for (let attempt = 0; attempt < 40; attempt += 1) {
            if (document.querySelector('[data-help-panel]')) break;
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          const panelVisible = document.querySelector('[data-help-panel]') instanceof HTMLElement;
          const terms = ['Instagram', 'WhatsApp', 'Papierkorb', 'Zielordner', 'Downloadmodus'];
          const termResults = [];
          for (const term of terms) {
            const searchInput = document.querySelector('[data-help-search]');
            if (!(searchInput instanceof HTMLInputElement)) break;
            searchInput.value = term;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 150));
            termResults.push((document.querySelector('.help-content')?.textContent ?? '').toLowerCase().includes(term.toLowerCase()));
          }
          helpReady = panelVisible && termResults.length === terms.length && termResults.every(Boolean);
        }
        return settingsPanelVisible
          && saved.saved === true
          && reloadedSettings.targetFolder === ${JSON.stringify(smokeTestTargetFolder)}
          && folder.folderExists === true
          && folder.files.some((file) => file.name === "electron-test.mp4")
          && analysisReady
          && downloadReady
          && copyReady
          && settingsReady
          && trashReady
          && helpReady;
      })()
    `
    : `
      (async () => {
        for (let attempt = 0; attempt < 100; attempt += 1) {
          if (typeof window.nelly === 'object' && document.querySelector('[data-action="settings"]')) break;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        const apiReady = typeof window.nelly === 'object' && typeof window.nelly.getAppVersion === 'function';
        document.querySelector('[data-action="settings"]')?.click();
        const settingsPanel = document.querySelector('[data-settings-panel]');
        return apiReady && settingsPanel instanceof HTMLElement && !settingsPanel.hidden;
      })()
    `;

  try {
    const testPassed = await mainWindow.webContents.executeJavaScript(testScript);

    if (testPassed) {
      app.exit(0);
    } else {
      const diagnostics = await mainWindow.webContents.executeJavaScript(`
        JSON.stringify({
          hasNelly: typeof window.nelly,
          hasSettingsButton: Boolean(document.querySelector('[data-action="settings"]')),
          hasHelpButton: Boolean(document.querySelector('[data-action="help"]')),
          hasHelpPanel: Boolean(document.querySelector('[data-help-panel]')),
          helpText: document.querySelector('[data-help-panel]')?.textContent?.slice(0, 200) ?? '',
          hasHelpSearch: Boolean(document.querySelector('[data-help-search]')),
          settingsPanel: Boolean(document.querySelector('[data-settings-panel]')),
          detailsText: document.querySelector('.details-panel')?.textContent ?? '',
          bodyText: document.body.innerText.slice(0, 200)
        })
      `);
      console.error(`Electron-Smoke-Test fehlgeschlagen: ${diagnostics}`);
      app.exit(1);
    }
  } catch (error) {
    console.error("Electron-Smoke-Test fehlgeschlagen.", error);
    app.exit(1);
  }
}

async function listTargetFolder(): Promise<TargetFolderState> {
  const settings = await readSettings();
  const targetFolder = settings.targetFolder;

  try {
    const entries = await fs.readdir(targetFolder, { withFileTypes: true });
    const files: OutputFile[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).slice(1).toLowerCase();

      if (!supportedExtensions.has(extension)) {
        continue;
      }

      const filePath = path.join(targetFolder, entry.name);
      const stats = await fs.stat(filePath);

      files.push({
        id: entry.name,
        name: entry.name,
        size: formatBytes(stats.size),
        date: formatDate(stats.mtime),
        type: extension.toUpperCase(),
        selected: false,
      });
    }

    files.sort((left, right) => left.name.localeCompare(right.name, "de"));

    return {
      files,
      folderExists: true,
      message: files.length > 0
        ? null
        : "Der Zielordner ist leer oder enthält keine unterstützten Medien-Dateien.",
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        files: [],
        folderExists: false,
        message: "Der gespeicherte Zielordner existiert nicht. Bitte wähle in den Einstellungen einen gültigen Ordner aus.",
      };
    }

    console.error("Zielordner konnte nicht gelesen werden.", error);
    return {
      files: [],
      folderExists: false,
      message: "Der Zielordner konnte nicht gelesen werden. Bitte prüfe die Berechtigungen oder wähle einen anderen Ordner.",
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toLocaleString("de-DE", { maximumFractionDigits: value >= 10 ? 0 : 1 })} ${units[unitIndex]}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function registerIpc(): void {
  ipcMain.handle("app:get-version", () => app.getVersion());

  ipcMain.handle("settings:get", () => readSettings());

  ipcMain.handle("settings:save", async (_event, settings: AppSettings) => {
    const savedSettings = await writeSettings(settings);

    return {
      saved: true,
      settings: savedSettings,
      message: "Einstellungen wurden gespeichert.",
    };
  });

  ipcMain.handle("folder:select-target", async () => {
    const currentSettings = await readSettings();
    const dialogOptions: OpenDialogOptions = {
      title: "Zielordner auswählen",
      defaultPath: currentSettings.targetFolder,
      properties: ["openDirectory", "createDirectory"],
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    if (result.canceled || result.filePaths.length === 0) {
      return {
        canceled: true,
        path: null,
        settings: currentSettings,
        message: "Ordnerauswahl wurde abgebrochen.",
      };
    }

    const nextSettings = await writeSettings({
      ...currentSettings,
      targetFolder: result.filePaths[0],
    });

    return {
      canceled: false,
      path: nextSettings.targetFolder,
      settings: nextSettings,
      message: "Zielordner wurde gespeichert.",
    };
  });

  ipcMain.handle("folder:list-target", () => listTargetFolder());

  ipcMain.handle("files:copy-selected", async (_event, fileIds: string[]) => {
    const settings = await readSettings();
    return copyTargetFilesToClipboard(fileIds, settings.targetFolder);
  });

  ipcMain.handle("files:delete-selected", async (_event, fileIds: string[]) => {
    const settings = await readSettings();
    return moveTargetFilesToTrash(fileIds, settings.targetFolder);
  });

  ipcMain.handle("link:analyze", async (_event, url: string) => {
    console.log("analyzeLink IPC aufgerufen");
    const settings = await readSettings();

    try {
      return await analyzeLinkWithYtDlp(url, settings, projectRoot);
    } catch (error) {
      console.error("yt-dlp Analyse fehlgeschlagen", error);
      throw error;
    }
  });

  ipcMain.handle("download:start", async (event, url: string) => {
    if (downloadRunning) {
      throw new Error("Es laeuft bereits ein Download. Bitte warte, bis er abgeschlossen ist.");
    }

    downloadRunning = true;
    const settings = await readSettings();
    const sendProgress = (progress: DownloadProgressEvent) => {
      event.sender.send("download:progress", progress);
    };

    try {
      const result = await downloadLinkWithYtDlp(url, settings, projectRoot, sendProgress);

      return {
        started: true,
        url: result.url,
        outputPath: result.outputPath,
        message: result.compatibilityMessage,
      };
    } catch (error) {
      sendProgress({
        phase: "error",
        total: 0,
        download: 0,
        conversion: 0,
        status: "Download fehlgeschlagen",
      });
      console.error("yt-dlp Download fehlgeschlagen", error);
      throw error;
    } finally {
      downloadRunning = false;
    }
  });
}

registerIpc();

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
