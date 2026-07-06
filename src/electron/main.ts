import { app, BrowserWindow, dialog, ipcMain } from "electron/main";
import type { BrowserWindow as BrowserWindowInstance, OpenDialogOptions } from "electron/main";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { AppSettings, OutputFile, TargetFolderState } from "../types/app";

const devServerUrl = process.env.NELLY_ELECTRON_DEV_URL;
const isSmokeTest = process.env.NELLY_ELECTRON_SMOKE_TEST === "1";
const smokeTestTargetFolder = process.env.NELLY_ELECTRON_TEST_TARGET_FOLDER;
const smokeTestUserData = process.env.NELLY_ELECTRON_TEST_USER_DATA;
const supportedExtensions = new Set(["mp4", "mkv", "webm", "mov", "avi", "mp3", "m4a", "wav", "opus"]);

if (smokeTestUserData) {
  app.setPath("userData", smokeTestUserData);
}

let mainWindow: BrowserWindowInstance | null = null;

function getDefaultSettings(): AppSettings {
  return {
    targetFolder: path.join(app.getPath("videos"), "NellyDownloads"),
    preferredFormat: "MP4, H.264 bevorzugt",
    whatsappCompatibleOutput: true,
    cookieMode: "auto",
    browser: "Automatisch",
  };
}

function getSettingsPath(): string {
  return path.join(app.getPath("userData"), "settings.json");
}

async function readSettings(): Promise<AppSettings> {
  const defaults = getDefaultSettings();

  try {
    const rawSettings = await fs.readFile(getSettingsPath(), "utf-8");
    const parsedSettings = JSON.parse(rawSettings) as Partial<AppSettings>;

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
        const apiReady = typeof window.nelly === 'object' && typeof window.nelly.getAppVersion === 'function';
        if (!apiReady) return false;
        document.querySelector('[data-action="settings"]')?.click();
        const settingsPanel = document.querySelector('[data-settings-panel]');
        const settingsPanelVisible = settingsPanel instanceof HTMLElement && !settingsPanel.hidden;
        const settings = await window.nelly.getSettings();
        const saved = await window.nelly.saveSettings({ ...settings, targetFolder: ${JSON.stringify(smokeTestTargetFolder)} });
        const reloadedSettings = await window.nelly.getSettings();
        const folder = await window.nelly.listTargetFolder();
        return settingsPanelVisible
          && saved.saved === true
          && reloadedSettings.targetFolder === ${JSON.stringify(smokeTestTargetFolder)}
          && folder.folderExists === true
          && folder.files.some((file) => file.name === "electron-test.mp4");
      })()
    `
    : `
      (() => {
        const apiReady = typeof window.nelly === 'object' && typeof window.nelly.getAppVersion === 'function';
        document.querySelector('[data-action="settings"]')?.click();
        const settingsPanel = document.querySelector('[data-settings-panel]');
        return apiReady && settingsPanel instanceof HTMLElement && !settingsPanel.hidden;
      })()
    `;

  try {
    const testPassed = await mainWindow.webContents.executeJavaScript(testScript);

    if (testPassed) {
      mainWindow.close();
    } else {
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
        id: filePath,
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

  ipcMain.handle("files:copy-selected", (_event, fileIds: string[]) => ({
    copied: false,
    fileIds,
    message: "Kopieren ist noch deaktiviert und führt keine Dateiaktion aus.",
  }));

  ipcMain.handle("files:delete-selected", (_event, fileIds: string[]) => ({
    deleted: false,
    fileIds,
    message: "Löschen ist noch deaktiviert und führt keine Dateiaktion aus.",
  }));

  ipcMain.handle("link:analyze", (_event, url: string) => ({
    url,
    platform: "Noch nicht analysiert",
    title: "-",
    creator: "-",
    videoId: "-",
    duration: "-",
    thumbnailLabel: "Vorschau",
    expectedOutput: "MP4, H.264 bevorzugt",
    cookiesHint: "Analyse ist vorbereitet, ruft aber noch kein yt-dlp auf.",
  }));

  ipcMain.handle("download:start", (_event, url: string) => ({
    started: false,
    url,
    message: "Download ist vorbereitet, ruft aber noch keine externen Tools auf.",
  }));
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
