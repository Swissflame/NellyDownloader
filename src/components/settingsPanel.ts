import type { AppSettings } from "../types/app";

export function renderSettingsPanel(settings: AppSettings): string {
  return `
    <section class="panel compact-panel" aria-labelledby="settings-heading" hidden>
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Konfiguration</p>
          <h2 id="settings-heading">Einstellungen</h2>
        </div>
      </div>
      <dl class="details-list">
        <div><dt>Zielordner</dt><dd>${settings.targetFolder}</dd></div>
        <div><dt>Browser</dt><dd>${settings.browser}</dd></div>
        <div><dt>Cookie-Modus</dt><dd>${settings.cookieMode}</dd></div>
        <div><dt>WhatsApp-Ausgabe</dt><dd>${settings.whatsappCompatibleOutput ? "Aktiv" : "Inaktiv"}</dd></div>
      </dl>
    </section>
  `;
}
