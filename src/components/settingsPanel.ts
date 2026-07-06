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
          <div>
            <dt>Downloadmodus</dt>
            <dd>
              <select data-settings-field="downloadMode" aria-label="Downloadmodus">
                <option value="auto" ${settings.downloadMode === "auto" ? "selected" : ""}>Automatisch</option>
                <option value="analyze-first" ${settings.downloadMode === "analyze-first" ? "selected" : ""}>Erst analysieren, dann herunterladen</option>
                <option value="direct" ${settings.downloadMode === "direct" ? "selected" : ""}>Direkt herunterladen</option>
              </select>
            </dd>
          </div>
          <div>
            <dt>WhatsApp-Kompatibilität</dt>
            <dd>
              <select data-settings-field="whatsappCompatibilityMode" aria-label="WhatsApp-Kompatibilität">
                <option value="auto" ${settings.whatsappCompatibilityMode === "auto" ? "selected" : ""}>Auto</option>
                <option value="always" ${settings.whatsappCompatibilityMode === "always" ? "selected" : ""}>Immer umwandeln</option>
                <option value="never" ${settings.whatsappCompatibilityMode === "never" ? "selected" : ""}>Nie umwandeln</option>
              </select>
            </dd>
          </div>
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
