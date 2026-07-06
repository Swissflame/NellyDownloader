import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings } from "../types/app";
import type { ElectronApi } from "../types/electronApi";

const electronApi: ElectronApi = {
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke("settings:save", settings),
  selectTargetFolder: () => ipcRenderer.invoke("folder:select-target"),
  listTargetFolder: () => ipcRenderer.invoke("folder:list-target"),
  copySelectedFiles: (fileIds: string[]) => ipcRenderer.invoke("files:copy-selected", fileIds),
  deleteSelectedFiles: (fileIds: string[]) => ipcRenderer.invoke("files:delete-selected", fileIds),
  analyzeLink: (url: string) => {
    console.log("analyzeLink aufgerufen");
    return ipcRenderer.invoke("link:analyze", url);
  },
  startDownload: (url: string) => ipcRenderer.invoke("download:start", url),
};

contextBridge.exposeInMainWorld("nelly", electronApi);
