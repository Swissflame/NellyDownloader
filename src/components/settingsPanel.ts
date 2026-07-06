import type { AppSettings } from "../types/app";
import { escapeHtml } from "../utils/html";

export function renderSettingsPanel(settings: AppSettings, visible: boolean): string {
  if (!visible) {
    return "";
  }

  return `
    <div class="settings-backdrop" data-settings-panel>
      <section class="panel compact-panel settings-panel" aria-labelledby="settings-heading" role="dialog" aria-modal="true">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Konfiguration</p>
            <h2 id="settings-heading">Einstellungen</h2>
          </div>
          <button class="ghost-button" type="button" data-action="close-settings">Schließen</button>
        </div>
        <dl class="details-list">
          <div><dt>Zielordner</dt><dd data-settings-target-folder>${escapeHtml(settings.targetFolder)}</dd></div>
          <div><dt>Browser</dt><dd>${escapeHtml(settings.browser)}</dd></div>
          <div><dt>Cookie-Modus</dt><dd>${escapeHtml(settings.cookieMode)}</dd></div>
          <div><dt>WhatsApp-Ausgabe</dt><dd>${settings.whatsappCompatibleOutput ? "Aktiv" : "Inaktiv"}</dd></div>
          <div><dt>yt-dlp</dt><dd>${escapeHtml(settings.ytDlpPath ?? "Automatisch suchen")}</dd></div>
        </dl>
        <p class="settings-note">Einstellungen werden automatisch in der lokalen App-Konfiguration gespeichert.</p>
        <div class="settings-actions">
          <button class="secondary-button" type="button" data-action="select-target-folder">Zielordner auswählen</button>
          <button class="primary-button" type="button" data-action="save-settings">Speichern</button>
        </div>
      </section>
    </div>
  `;
}
