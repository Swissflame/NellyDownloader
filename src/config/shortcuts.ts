import type { KeyboardShortcuts, ShortcutAction } from "../types/app";

export type ShortcutDescription = {
  action: ShortcutAction;
  label: string;
};

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcuts = {
  startDownload: "Ctrl+Enter",
  downloadFromClipboard: "Ctrl+Shift+V",
  refreshTargetFolder: "F5",
  openSettings: "Ctrl+,",
  openHelp: "F1",
  openAbout: "Ctrl+I",
  copySelectedFiles: "Ctrl+Shift+C",
  deleteSelectedFiles: "Delete",
  closeDialog: "Esc",
  selectAllFiles: "Ctrl+A",
};

export const SHORTCUT_DESCRIPTIONS: ShortcutDescription[] = [
  { action: "startDownload", label: "Download mit aktuellem Link starten" },
  { action: "downloadFromClipboard", label: "Link aus Zwischenablage uebernehmen und starten" },
  { action: "refreshTargetFolder", label: "Zielordner aktualisieren" },
  { action: "openSettings", label: "Einstellungen oeffnen" },
  { action: "openHelp", label: "Hilfe oeffnen" },
  { action: "openAbout", label: "Info oeffnen" },
  { action: "copySelectedFiles", label: "Ausgewaehlte Dateien kopieren" },
  { action: "deleteSelectedFiles", label: "Ausgewaehlte Dateien in den Papierkorb verschieben" },
  { action: "closeDialog", label: "Offenen Dialog schliessen" },
  { action: "selectAllFiles", label: "Alle Dateien in der Dateiliste auswaehlen" },
];
