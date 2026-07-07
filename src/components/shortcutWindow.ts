import { DEFAULT_KEYBOARD_SHORTCUTS, SHORTCUT_DESCRIPTIONS } from "../config/shortcuts";
import type { AppSettings, ShortcutAction } from "../types/app";
import { escapeHtml } from "../utils/html";

export type ShortcutCaptureState = {
  action: ShortcutAction;
  label: string;
} | null;

export function renderShortcutWindow(
  settings: AppSettings,
  capture: ShortcutCaptureState,
  message: string | null,
): string {
  return `
    <main class="standalone-window shortcut-window-shell" data-shortcut-window>
      <section class="panel shortcut-window-panel" aria-labelledby="shortcut-window-heading">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Konfiguration</p>
            <h2 id="shortcut-window-heading">Tastenkombinationen</h2>
          </div>
          <button class="ghost-button" type="button" data-action="close-window">Schliessen</button>
        </div>
        <p class="settings-note">
          Shortcuts gelten nur, wenn NellyDownloader aktiv ist. Sie sind normale Tastenkombinationen und eignen sich fuer Logitech-Profile.
        </p>
        ${message ? `<div class="inline-message" role="status">${escapeHtml(message)}</div>` : ""}
        ${capture ? `
          <div class="capture-box" data-shortcut-capture>
            <strong>${escapeHtml(capture.label)}</strong>
            <span>Neue Tastenkombination druecken. Esc bricht ab.</span>
          </div>
        ` : ""}
        <div class="shortcut-editor-list" role="table" aria-label="Tastenkombinationen bearbeiten">
          ${SHORTCUT_DESCRIPTIONS.map((shortcut) => renderShortcutRow(shortcut.action, shortcut.label, settings)).join("")}
        </div>
        <div class="settings-actions">
          <button class="secondary-button" type="button" data-action="reset-all-shortcuts">Alle auf Standard zuruecksetzen</button>
          <button class="ghost-button" type="button" data-action="close-window">Schliessen</button>
        </div>
      </section>
    </main>
  `;
}

function renderShortcutRow(action: ShortcutAction, label: string, settings: AppSettings): string {
  const shortcut = settings.keyboardShortcuts[action] ?? "";
  const defaultShortcut = DEFAULT_KEYBOARD_SHORTCUTS[action] ?? "";

  return `
    <div class="shortcut-editor-row" role="row">
      <span role="cell">${escapeHtml(label)}</span>
      <kbd role="cell">${escapeHtml(shortcut || "Nicht belegt")}</kbd>
      <span class="shortcut-default" role="cell">Standard: ${escapeHtml(defaultShortcut || "Nicht belegt")}</span>
      <div class="shortcut-row-actions" role="cell">
        <button class="secondary-button" type="button" data-action="capture-shortcut" data-shortcut-action="${escapeHtml(action)}">Aendern</button>
        <button class="ghost-button" type="button" data-action="reset-shortcut" data-shortcut-action="${escapeHtml(action)}">Zuruecksetzen</button>
        <button class="ghost-button" type="button" data-action="clear-shortcut" data-shortcut-action="${escapeHtml(action)}">Entfernen</button>
      </div>
    </div>
  `;
}
