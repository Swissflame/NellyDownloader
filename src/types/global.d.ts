import type { ElectronApi } from "./electronApi";

declare global {
  interface Window {
    nelly?: ElectronApi;
  }
}

export {};
