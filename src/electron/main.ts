import { app, BrowserWindow, ipcMain } from "electron/main";
import type { BrowserWindow as BrowserWindowInstance } from "electron/main";
import * as path from "node:path";

const devServerUrl = process.env.NELLY_ELECTRON_DEV_URL;
const isSmokeTest = process.env.NELLY_ELECTRON_SMOKE_TEST === "1";

let mainWindow: BrowserWindowInstance | null = null;

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
      void mainWindow?.webContents
        .executeJavaScript("typeof window.nelly === 'object' && typeof window.nelly.getAppVersion === 'function'")
        .then((preloadReady) => {
          if (preloadReady) {
            mainWindow?.close();
          } else {
            app.exit(1);
          }
        })
        .catch(() => app.exit(1));
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerPlaceholderIpc(): void {
  ipcMain.handle("app:get-version", () => app.getVersion());

  ipcMain.handle("settings:get", () => ({
    targetFolder: "C:\\Users\\Public\\Videos\\NellyDownloads",
    preferredFormat: "MP4, H.264 bevorzugt",
    whatsappCompatibleOutput: true,
    cookieMode: "auto",
    browser: "Automatisch",
  }));

  ipcMain.handle("settings:save", (_event, settings) => ({
    saved: false,
    settings,
    message: "Einstellungen werden später lokal gespeichert.",
  }));

  ipcMain.handle("folder:select-target", () => ({
    canceled: true,
    path: null,
    message: "Ordnerauswahl ist vorbereitet, aber noch nicht aktiviert.",
  }));

  ipcMain.handle("folder:list-target", () => []);

  ipcMain.handle("files:copy-selected", (_event, fileIds: string[]) => ({
    copied: false,
    fileIds,
    message: "Kopieren ist vorbereitet, führt aber noch keine Dateiaktion aus.",
  }));

  ipcMain.handle("files:delete-selected", (_event, fileIds: string[]) => ({
    deleted: false,
    fileIds,
    message: "Löschen ist vorbereitet, führt aber noch keine Dateiaktion aus.",
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

registerPlaceholderIpc();

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
