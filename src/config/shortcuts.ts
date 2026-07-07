import type { KeyboardShortcuts, ShortcutAction } from "../types/app";

export type ShortcutDescription = {
  action: ShortcutAction;
  label: string;
};

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcuts = {
  startDownload: "Ctrl+Enter",
  downloadFromClipboard: "Ctrl+Shift+V",
  focusLinkInput: "Ctrl+L",
  clearLinkInput: "Ctrl+Shift+L",
  analyzeCurrentLink: "Ctrl+Shift+Enter",
  openTargetFolderSettings: "Ctrl+Shift+,",
  refreshTargetFolder: "F5",
  openTargetFolder: "Ctrl+O",
  revealSelectedFile: "Ctrl+Shift+O",
  openSettings: "Ctrl+,",
  openHelp: "F1",
  openAbout: "Ctrl+I",
  copySelectedFiles: "Ctrl+Shift+C",
  deleteSelectedFiles: "Delete",
  closeDialog: "Esc",
  selectAllFiles: "Ctrl+A",
  deselectAllFiles: "Ctrl+Shift+A",
  invertFileSelection: "Ctrl+Alt+A",
  selectNewestFile: "Ctrl+Shift+N",
  selectFirstFile: "Home",
  selectLastFile: "End",
  moveSelectionUp: "ArrowUp",
  moveSelectionDown: "ArrowDown",
};

export const SHORTCUT_DESCRIPTIONS: ShortcutDescription[] = [
  { action: "startDownload", label: "Download mit aktuellem Link starten" },
  { action: "downloadFromClipboard", label: "Link aus Zwischenablage uebernehmen und starten" },
  { action: "focusLinkInput", label: "Linkfeld fokussieren" },
  { action: "clearLinkInput", label: "Linkfeld leeren" },
  { action: "analyzeCurrentLink", label: "Aktuellen Link nur analysieren" },
  { action: "openTargetFolderSettings", label: "Zielordner auswaehlen" },
  { action: "refreshTargetFolder", label: "Zielordner aktualisieren" },
  { action: "openTargetFolder", label: "Zielordner im Explorer oeffnen" },
  { action: "revealSelectedFile", label: "Ausgewaehlte Datei im Explorer anzeigen" },
  { action: "openSettings", label: "Einstellungen oeffnen" },
  { action: "openHelp", label: "Hilfe oeffnen" },
  { action: "openAbout", label: "Info oeffnen" },
  { action: "copySelectedFiles", label: "Ausgewaehlte Dateien kopieren" },
  { action: "deleteSelectedFiles", label: "Ausgewaehlte Dateien in den Papierkorb verschieben" },
  { action: "closeDialog", label: "Offenen Dialog schliessen" },
  { action: "selectAllFiles", label: "Alle Dateien in der Dateiliste auswaehlen" },
  { action: "deselectAllFiles", label: "Alle Dateien in der Dateiliste abwaehlen" },
  { action: "invertFileSelection", label: "Auswahl in der Dateiliste invertieren" },
  { action: "selectNewestFile", label: "Neueste Datei auswaehlen" },
  { action: "selectFirstFile", label: "Erste Datei auswaehlen" },
  { action: "selectLastFile", label: "Letzte Datei auswaehlen" },
  { action: "moveSelectionUp", label: "Auswahl nach oben bewegen" },
  { action: "moveSelectionDown", label: "Auswahl nach unten bewegen" },
];
