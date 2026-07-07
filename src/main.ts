import { renderApp, bindApp } from "./components/app";
import { showConfirmDialog, showDialog } from "./components/dialog";
import { renderHelpWindow } from "./components/helpPanel";
import { renderShortcutWindow, type ShortcutCaptureState } from "./components/shortcutWindow";
import { DEFAULT_SETTINGS, EMPTY_LINK_DETAILS, IDLE_PROGRESS } from "./config/defaults";
import { UI_ASSETS } from "./config/assets";
import { DEFAULT_KEYBOARD_SHORTCUTS, SHORTCUT_DESCRIPTIONS } from "./config/shortcuts";
import { initialState } from "./data/demoState";
import type {
  AppSettings,
  AppState,
  DownloadMode,
  DownloadProgressEvent,
  OriginalAfterConversionMode,
  ShortcutAction,
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
const windowMode = new URLSearchParams(window.location.search).get("window");
let toastTimeout: number | undefined;
let state: AppState = {
  ...initialState,
  settings: DEFAULT_SETTINGS,
};
let helpWindowSearch = "";
let shortcutWindowSettings: AppSettings = DEFAULT_SETTINGS;
let shortcutCapture: ShortcutCaptureState = null;
let shortcutWindowMessage: string | null = null;

document.documentElement.style.setProperty("--app-background-image", `url('${UI_ASSETS.appBackground}')`);

if (windowMode === "help") {
  document.body.classList.add("standalone-body");
  renderHelpStandalone();
} else if (windowMode === "shortcuts") {
  document.body.classList.add("standalone-body");
  void initializeShortcutWindow();
} else {
  render();
  localApi.onDownloadProgress((progress) => {
    applyDownloadProgress(progress);
  });
  localApi.onSettingsChanged((settings) => {
    state = {
      ...state,
      settings,
    };
    render();
  });
  void initializeApp();
}

function render(): void {
  appElement.innerHTML = renderApp(state);
  bindApp();
}

function renderHelpStandalone(): void {
  appElement.innerHTML = renderHelpWindow(helpWindowSearch);
}

async function initializeShortcutWindow(): Promise<void> {
  try {
    shortcutWindowSettings = await localApi.getSettings();
  } catch {
    shortcutWindowSettings = DEFAULT_SETTINGS;
  }

  renderShortcutStandalone();
}

function renderShortcutStandalone(): void {
  appElement.innerHTML = renderShortcutWindow(shortcutWindowSettings, shortcutCapture, shortcutWindowMessage);
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

  if (windowMode === "shortcuts") {
    void handleShortcutWindowAction(action, target);
    return;
  }

  void handleAction(action);
});

document.addEventListener("change", (event) => {
  const target = event.target;

  if (target instanceof HTMLInputElement && target.dataset.fileId) {
    updateTargetFileSelection(target.dataset.fileId, target.checked);
    return;
  }

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

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (windowMode === "help" && target.matches("[data-help-search]")) {
    helpWindowSearch = target.value;
    renderHelpStandalone();
    const nextSearchInput = document.querySelector<HTMLInputElement>("[data-help-search]");
    nextSearchInput?.focus();
    nextSearchInput?.setSelectionRange(nextSearchInput.value.length, nextSearchInput.value.length);
    return;
  }

  if (target.id === "download-link") {
    updateLinkInput(target);
    return;
  }

  if (!target.matches("[data-help-search]")) {
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

function updateLinkInput(input: HTMLInputElement): void {
  const nextValue = input.value;
  const linkChanged = nextValue.trim() !== state.linkInput.trim();
  const shouldResetDetails = linkChanged && !isLinkDetailsEmpty(state.linkDetails);

  state = {
    ...state,
    linkInput: nextValue,
    ...(shouldResetDetails ? {
      linkDetails: createEmptyLinkDetails(),
      progress: IDLE_PROGRESS,
    } : {}),
  };

  if (!shouldResetDetails) {
    return;
  }

  const selectionStart = input.selectionStart;
  const selectionEnd = input.selectionEnd;
  render();
  const nextInput = document.querySelector<HTMLInputElement>("#download-link");
  nextInput?.focus();

  if (selectionStart !== null && selectionEnd !== null) {
    nextInput?.setSelectionRange(selectionStart, selectionEnd);
  }
}

document.addEventListener("keydown", (event) => {
  if (windowMode === "shortcuts") {
    void handleShortcutWindowKeydown(event);
    return;
  }

  if (windowMode === "help") {
    if (keyboardEventToShortcut(event) === "Esc") {
      event.preventDefault();
      void localApi.closeCurrentWindow();
    }
    return;
  }

  void handleKeyboardShortcut(event);
});

async function handleAction(action: string): Promise<void> {
  switch (action) {
    case "settings":
      state = { ...state, settingsVisible: true };
      render();
      return;
    case "open-shortcuts":
      await localApi.openShortcutWindow();
      return;
    case "close-window":
      await localApi.closeCurrentWindow();
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
    case "open-target-folder":
      await openTargetFolder();
      return;
    case "reveal-file":
      await revealSelectedFile();
      return;
    case "copy":
      await showFileActionPlaceholder("copy");
      return;
    case "delete":
      await showFileActionPlaceholder("delete");
      return;
    case "help":
      await localApi.openHelpWindow();
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

async function handleShortcutWindowAction(action: string, target: HTMLElement): Promise<void> {
  if (action === "close-window") {
    await localApi.closeCurrentWindow();
    return;
  }

  if (action === "reset-all-shortcuts") {
    shortcutWindowSettings = {
      ...shortcutWindowSettings,
      keyboardShortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
    };
    await saveShortcutWindowSettings("Alle Tastenkombinationen wurden auf Standard zurueckgesetzt.");
    return;
  }

  const shortcutAction = target.dataset.shortcutAction;

  if (!isShortcutAction(shortcutAction)) {
    return;
  }

  const description = SHORTCUT_DESCRIPTIONS.find((item) => item.action === shortcutAction);

  if (action === "capture-shortcut") {
    shortcutCapture = {
      action: shortcutAction,
      label: description?.label ?? shortcutAction,
    };
    shortcutWindowMessage = null;
    renderShortcutStandalone();
    return;
  }

  if (action === "reset-shortcut") {
    shortcutWindowSettings = {
      ...shortcutWindowSettings,
      keyboardShortcuts: {
        ...shortcutWindowSettings.keyboardShortcuts,
        [shortcutAction]: DEFAULT_KEYBOARD_SHORTCUTS[shortcutAction],
      },
    };
    await saveShortcutWindowSettings("Tastenkombination wurde zurueckgesetzt.");
    return;
  }

  if (action === "clear-shortcut") {
    shortcutWindowSettings = {
      ...shortcutWindowSettings,
      keyboardShortcuts: {
        ...shortcutWindowSettings.keyboardShortcuts,
        [shortcutAction]: "",
      },
    };
    await saveShortcutWindowSettings("Tastenkombination wurde entfernt.");
  }
}

async function handleShortcutWindowKeydown(event: KeyboardEvent): Promise<void> {
  const shortcut = keyboardEventToShortcut(event);

  if (!shortcutCapture) {
    if (shortcut === "Esc") {
      event.preventDefault();
      await localApi.closeCurrentWindow();
    }
    return;
  }

  event.preventDefault();

  if (shortcut === "Esc") {
    shortcutCapture = null;
    shortcutWindowMessage = "Aufnahme abgebrochen.";
    renderShortcutStandalone();
    return;
  }

  if (!isValidAssignableShortcut(shortcut)) {
    shortcutWindowMessage = "Diese Tastenkombination ist nicht geeignet. Nutze z.B. Ctrl, Alt oder eine Funktionstaste.";
    renderShortcutStandalone();
    return;
  }

  const conflict = findShortcutConflict(shortcut, shortcutCapture.action, shortcutWindowSettings);

  if (conflict) {
    shortcutWindowMessage = `Konflikt: ${shortcut} ist bereits fuer "${conflict}" vergeben.`;
    renderShortcutStandalone();
    return;
  }

  shortcutWindowSettings = {
    ...shortcutWindowSettings,
    keyboardShortcuts: {
      ...shortcutWindowSettings.keyboardShortcuts,
      [shortcutCapture.action]: shortcut,
    },
  };
  shortcutCapture = null;
  await saveShortcutWindowSettings("Tastenkombination wurde gespeichert.");
}

async function saveShortcutWindowSettings(message: string): Promise<void> {
  const result = await localApi.saveSettings(shortcutWindowSettings);
  shortcutWindowSettings = result.settings;
  shortcutWindowMessage = message;
  renderShortcutStandalone();
}

async function handleKeyboardShortcut(event: KeyboardEvent): Promise<void> {
  const shortcut = keyboardEventToShortcut(event);
  const shortcuts = {
    ...DEFAULT_KEYBOARD_SHORTCUTS,
    ...state.settings.keyboardShortcuts,
  };
  const targetIsEditable = isEditableTarget(event.target);
  const modalOpen = hasOpenModal();

  if (shortcut === shortcuts.closeDialog) {
    if (closeOpenModal()) {
      event.preventDefault();
    }
    return;
  }

  if (modalOpen) {
    return;
  }

  if (shortcut === shortcuts.startDownload) {
    event.preventDefault();
    await startDownloadWorkflow(getCurrentLinkInputValue());
    return;
  }

  if (shortcut === shortcuts.downloadFromClipboard) {
    event.preventDefault();
    await startDownloadFromClipboard();
    return;
  }

  if (shortcut === shortcuts.focusLinkInput) {
    event.preventDefault();
    focusLinkInput();
    return;
  }

  if (shortcut === shortcuts.clearLinkInput) {
    event.preventDefault();
    clearLinkInput();
    return;
  }

  if (shortcut === shortcuts.analyzeCurrentLink) {
    event.preventDefault();
    await analyzeCurrentLinkOnly();
    return;
  }

  if (shortcut === shortcuts.openTargetFolderSettings) {
    event.preventDefault();
    state = { ...state, settingsVisible: true };
    render();
    await selectTargetFolder();
    return;
  }

  if (shortcut === shortcuts.refreshTargetFolder) {
    event.preventDefault();
    await refreshTargetFolder();
    return;
  }

  if (shortcut === shortcuts.openTargetFolder) {
    event.preventDefault();
    await openTargetFolder();
    return;
  }

  if (shortcut === shortcuts.revealSelectedFile) {
    event.preventDefault();
    await revealSelectedFile();
    return;
  }

  if (shortcut === shortcuts.openSettings) {
    event.preventDefault();
    state = { ...state, settingsVisible: true };
    render();
    return;
  }

  if (shortcut === shortcuts.openHelp) {
    event.preventDefault();
    await localApi.openHelpWindow();
    return;
  }

  if (shortcut === shortcuts.openAbout) {
    event.preventDefault();
    state = { ...state, aboutVisible: true };
    render();
    return;
  }

  if (targetIsEditable) {
    return;
  }

  if (shortcut === shortcuts.copySelectedFiles) {
    event.preventDefault();
    await showFileActionPlaceholder("copy");
    return;
  }

  if (shortcut === shortcuts.deleteSelectedFiles) {
    event.preventDefault();
    await showFileActionPlaceholder("delete");
    return;
  }

  if (shortcut === shortcuts.selectAllFiles) {
    event.preventDefault();
    selectAllTargetFiles();
    return;
  }

  if (shortcut === shortcuts.deselectAllFiles) {
    event.preventDefault();
    deselectAllTargetFiles();
    return;
  }

  if (shortcut === shortcuts.invertFileSelection) {
    event.preventDefault();
    invertTargetFileSelection();
    return;
  }

  if (shortcut === shortcuts.selectNewestFile) {
    event.preventDefault();
    selectNewestTargetFile();
    return;
  }

  if (shortcut === shortcuts.selectFirstFile && isFileListFocused()) {
    event.preventDefault();
    selectTargetFileAt(0);
    return;
  }

  if (shortcut === shortcuts.selectLastFile && isFileListFocused()) {
    event.preventDefault();
    selectTargetFileAt(state.targetFolder.files.length - 1);
    return;
  }

  if (shortcut === shortcuts.moveSelectionUp && isFileListFocused()) {
    event.preventDefault();
    moveTargetFileSelection(-1);
    return;
  }

  if (shortcut === shortcuts.moveSelectionDown && isFileListFocused()) {
    event.preventDefault();
    moveTargetFileSelection(1);
  }
}

function keyboardEventToShortcut(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey) {
    parts.push("Ctrl");
  }

  if (event.shiftKey) {
    parts.push("Shift");
  }

  if (event.altKey) {
    parts.push("Alt");
  }

  parts.push(normalizeShortcutKey(event.key));

  return parts.join("+");
}

function isShortcutAction(value: string | undefined): value is ShortcutAction {
  return SHORTCUT_DESCRIPTIONS.some((shortcut) => shortcut.action === value);
}

function isValidAssignableShortcut(shortcut: string): boolean {
  const parts = shortcut.split("+");
  const key = parts.at(-1) ?? "";
  const hasCtrlOrAlt = parts.includes("Ctrl") || parts.includes("Alt");
  const standaloneKeys = new Set([
    "Delete",
    "Home",
    "End",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "PageUp",
    "PageDown",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",
  ]);

  if (!key || key === "Esc") {
    return false;
  }

  if (standaloneKeys.has(key)) {
    return true;
  }

  if (/^[A-Z0-9]$/.test(key)) {
    return hasCtrlOrAlt;
  }

  return hasCtrlOrAlt;
}

function findShortcutConflict(shortcut: string, currentAction: ShortcutAction, settings: AppSettings): string | null {
  const conflict = SHORTCUT_DESCRIPTIONS.find((description) => (
    description.action !== currentAction
    && settings.keyboardShortcuts[description.action] === shortcut
  ));

  return conflict?.label ?? null;
}

function normalizeShortcutKey(key: string): string {
  if (key === "Escape") {
    return "Esc";
  }

  if (key.length === 1) {
    return key.toUpperCase();
  }

  return key;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (target instanceof HTMLInputElement) {
    return ["email", "number", "password", "search", "tel", "text", "url"].includes(target.type);
  }

  return target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement;
}

function hasOpenModal(): boolean {
  const dialog = document.querySelector<HTMLDialogElement>("[data-dialog]");

  return Boolean(dialog?.open || state.settingsVisible || state.helpVisible || state.aboutVisible);
}

function closeOpenModal(): boolean {
  const dialog = document.querySelector<HTMLDialogElement>("[data-dialog]");

  if (dialog?.open) {
    dialog.close("cancel");
    return true;
  }

  if (state.aboutVisible) {
    state = { ...state, aboutVisible: false };
    render();
    return true;
  }

  if (state.helpVisible) {
    state = { ...state, helpVisible: false, helpSearch: "" };
    render();
    return true;
  }

  if (state.settingsVisible) {
    state = { ...state, settingsVisible: false };
    render();
    return true;
  }

  return false;
}

function selectAllTargetFiles(): void {
  if (state.targetFolder.files.length === 0) {
    showToast("Keine Dateien im Zielordner.");
    return;
  }

  state = {
    ...state,
    targetFolder: {
      ...state.targetFolder,
      files: state.targetFolder.files.map((file) => ({ ...file, selected: true })),
    },
  };
  render();
  focusFileList();
}

function deselectAllTargetFiles(): void {
  if (state.targetFolder.files.length === 0) {
    showToast("Keine Dateien im Zielordner.");
    return;
  }

  state = {
    ...state,
    targetFolder: {
      ...state.targetFolder,
      files: state.targetFolder.files.map((file) => ({ ...file, selected: false })),
    },
  };
  render();
  focusFileList();
}

function invertTargetFileSelection(): void {
  if (state.targetFolder.files.length === 0) {
    showToast("Keine Dateien im Zielordner.");
    return;
  }

  state = {
    ...state,
    targetFolder: {
      ...state.targetFolder,
      files: state.targetFolder.files.map((file) => ({ ...file, selected: !file.selected })),
    },
  };
  render();
  focusFileList();
}

function selectNewestTargetFile(): void {
  const newestIndex = state.targetFolder.files.reduce((newest, file, index, files) => (
    file.modifiedAt > files[newest].modifiedAt ? index : newest
  ), 0);

  selectTargetFileAt(newestIndex);
}

function selectTargetFileAt(index: number): void {
  if (state.targetFolder.files.length === 0) {
    showToast("Keine Dateien im Zielordner.");
    return;
  }

  const boundedIndex = Math.max(0, Math.min(index, state.targetFolder.files.length - 1));

  state = {
    ...state,
    targetFolder: {
      ...state.targetFolder,
      files: state.targetFolder.files.map((file, fileIndex) => ({ ...file, selected: fileIndex === boundedIndex })),
    },
  };
  render();
  focusFileList();
  scrollSelectedFileIntoView();
}

function moveTargetFileSelection(direction: -1 | 1): void {
  if (state.targetFolder.files.length === 0) {
    showToast("Keine Dateien im Zielordner.");
    return;
  }

  const selectedIndex = state.targetFolder.files.findIndex((file) => file.selected);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
  selectTargetFileAt(currentIndex + direction);
}

function updateTargetFileSelection(fileId: string, selected: boolean): void {
  state = {
    ...state,
    targetFolder: {
      ...state.targetFolder,
      files: state.targetFolder.files.map((file) => (
        file.id === fileId ? { ...file, selected } : file
      )),
    },
  };
}

function focusLinkInput(): void {
  document.querySelector<HTMLInputElement>("#download-link")?.focus();
}

function clearLinkInput(): void {
  setCurrentLinkForNewWorkflow("", "Noch nicht analysiert");
  focusLinkInput();
}

async function analyzeCurrentLinkOnly(): Promise<void> {
  await analyzeLink(getCurrentLinkInputValue());
}

function isFileListFocused(): boolean {
  const activeElement = document.activeElement;

  return activeElement instanceof HTMLElement && Boolean(activeElement.closest("[data-file-list]"));
}

function focusFileList(): void {
  document.querySelector<HTMLElement>("[data-file-list]")?.focus();
}

function scrollSelectedFileIntoView(): void {
  document.querySelector(".file-row-selected")?.scrollIntoView({
    block: "nearest",
  });
}


function getCurrentLinkInputValue(): string {
  return document.querySelector<HTMLInputElement>("#download-link")?.value ?? state.linkInput;
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

async function openTargetFolder(): Promise<void> {
  try {
    const result = await localApi.openTargetFolder();
    showToast(result.message);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Der Zielordner konnte nicht geoeffnet werden.");
  }
}

async function revealSelectedFile(): Promise<void> {
  const selectedFileIds = getSelectedFileIds();

  if (selectedFileIds.length === 0) {
    showToast("Bitte zuerst eine Datei auswaehlen.");
    return;
  }

  if (selectedFileIds.length > 1) {
    showToast("Bitte nur eine Datei auswaehlen, um sie im Explorer anzuzeigen.");
    return;
  }

  try {
    const result = await localApi.revealSelectedFile(selectedFileIds[0]);
    showToast(result.message);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Die Datei konnte nicht im Explorer angezeigt werden.");
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
  const domSelectedIds = Array.from(document.querySelectorAll<HTMLInputElement>("[data-file-id]:checked"))
    .map((checkbox) => checkbox.dataset.fileId)
    .filter((fileId): fileId is string => typeof fileId === "string");

  if (domSelectedIds.length > 0) {
    return domSelectedIds;
  }

  return state.targetFolder.files
    .filter((file) => file.selected)
    .map((file) => file.id);
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
  if (state.downloadInProgress || state.analysisInProgress) {
    showToast("Es laeuft bereits ein Vorgang.");
    return;
  }

  try {
    const clipboardText = await localApi.readClipboardText();
    const url = findFirstValidHttpUrl(clipboardText);

    if (!url) {
      showToast("Keine gültige URL in der Zwischenablage.");
      return;
    }

    setCurrentLinkForNewWorkflow(url, "Noch nicht analysiert");
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
      ...createEmptyLinkDetails(),
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
        ...createEmptyLinkDetails(),
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
  if (state.downloadInProgress || state.analysisInProgress) {
    showToast("Es laeuft bereits ein Vorgang.");
    return;
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    state = {
      ...state,
      linkDetails: {
        ...createEmptyLinkDetails(),
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

  const analyzedForCurrentLink = state.linkInput === trimmedUrl
    && state.linkDetails.error === null
    && state.linkDetails.platform !== EMPTY_LINK_DETAILS.platform
    && state.linkDetails.platform !== "Analysiere...";
  const detailsForCurrentLink = analyzedForCurrentLink
    ? state.linkDetails
    : createEmptyLinkDetails({
        platform: "Download laeuft...",
        cookiesHint: "Metadaten werden fuer den aktuellen Link vorbereitet.",
      });
  const shouldAnalyzeBeforeDownload = state.settings.downloadMode === "analyze-first"
    || (state.settings.downloadMode === "auto" && analyzedForCurrentLink);

  state = {
    ...state,
    linkInput: trimmedUrl,
    downloadInProgress: true,
    analysisInProgress: false,
    linkDetails: detailsForCurrentLink,
    progress: {
      total: 0,
      download: 0,
      conversion: 0,
      status: shouldAnalyzeBeforeDownload && !analyzedForCurrentLink ? "Analysiere..." : "Download laeuft...",
    },
  };
  render();

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
    const completedDetails = analyzedForCurrentLink
      ? detailsForCurrentLink
      : createDownloadedLinkDetails(result.outputPath, state.settings.preferredFormat);

    state = {
      ...state,
      linkInput: result.url,
      downloadInProgress: false,
      progress: {
        total: 100,
        download: 100,
        conversion: 0,
        status: result.message,
      },
      linkDetails: {
        ...completedDetails,
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
        ...createEmptyLinkDetails(),
        error: error instanceof Error ? error.message : "Der Download ist fehlgeschlagen.",
      },
    };
    render();
  }
}

function setCurrentLinkForNewWorkflow(url: string, platform: string): void {
  state = {
    ...state,
    linkInput: url,
    linkDetails: createEmptyLinkDetails({ platform }),
    progress: IDLE_PROGRESS,
  };
  render();
}

function createEmptyLinkDetails(overrides: Partial<typeof EMPTY_LINK_DETAILS> = {}): typeof EMPTY_LINK_DETAILS {
  return {
    ...EMPTY_LINK_DETAILS,
    expectedOutput: state.settings.preferredFormat,
    ...overrides,
  };
}

function createDownloadedLinkDetails(outputPath: string | null, preferredFormat: string): typeof EMPTY_LINK_DETAILS {
  return {
    ...EMPTY_LINK_DETAILS,
    platform: "Direkt heruntergeladen",
    title: outputPath ? getFileName(outputPath) : "-",
    videoId: outputPath ? getVideoIdFromFileName(outputPath) : "-",
    expectedOutput: preferredFormat,
    cookiesHint: "Metadaten wurden im Downloadprozess verarbeitet.",
  };
}

function isLinkDetailsEmpty(details: typeof EMPTY_LINK_DETAILS): boolean {
  return details.platform === EMPTY_LINK_DETAILS.platform
    && details.title === EMPTY_LINK_DETAILS.title
    && details.creator === EMPTY_LINK_DETAILS.creator
    && details.videoId === EMPTY_LINK_DETAILS.videoId
    && details.thumbnailUrl === EMPTY_LINK_DETAILS.thumbnailUrl
    && details.error === EMPTY_LINK_DETAILS.error;
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
    openHelpWindow: async () => {
      window.open(`${window.location.pathname}?window=help`, "nelly-help");
      return {
        message: "Hilfe wurde im Browserfenster geoeffnet.",
      };
    },
    openShortcutWindow: async () => {
      window.open(`${window.location.pathname}?window=shortcuts`, "nelly-shortcuts");
      return {
        message: "Tastenkombinationen wurden im Browserfenster geoeffnet.",
      };
    },
    closeCurrentWindow: async () => {
      window.close();
      return {
        message: "Fenster wurde geschlossen.",
      };
    },
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
    openTargetFolder: async () => ({
      opened: false,
      message: "Der Zielordner kann nur in der Electron-App geoeffnet werden.",
    }),
    revealSelectedFile: async (fileId) => ({
      revealed: false,
      fileIds: [fileId],
      message: "Dateien koennen nur in der Electron-App im Explorer angezeigt werden.",
    }),
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
    onSettingsChanged: () => () => undefined,
  };
}
