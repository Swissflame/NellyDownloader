import { escapeHtml } from "../utils/html";

export function renderAboutPanel(visible: boolean, version: string): string {
  if (!visible) {
    return "";
  }

  return `
    <div class="settings-backdrop" data-about-panel>
      <section class="panel compact-panel about-panel" aria-labelledby="about-heading" role="dialog" aria-modal="true">
        <img class="about-banner" src="/about/about-banner.png" alt="NellyDownloader" />
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Info</p>
            <h2 id="about-heading">NellyDownloader</h2>
          </div>
          <button class="ghost-button" type="button" data-action="close-about">Schliessen</button>
        </div>
        <div class="about-content">
          <p>Lokale Desktop-App zum Analysieren, Herunterladen und Vorbereiten einzelner Medienlinks.</p>
          <dl class="about-facts">
            <div>
              <dt>Version</dt>
              <dd>${escapeHtml(version)}</dd>
            </div>
            <div>
              <dt>Werkzeuge</dt>
              <dd>yt-dlp, ffprobe und ffmpeg werden lokal im Electron Main-Prozess verwendet.</dd>
            </div>
            <div>
              <dt>Dateien</dt>
              <dd>Dateien werden nur im gewaehlten Zielordner verarbeitet.</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  `;
}
