import type { LinkDetails } from "../types/app";
import { escapeHtml } from "../utils/html";

export function renderLinkDetails(details: LinkDetails): string {
  return `
    <section class="panel details-panel" aria-labelledby="details-heading">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Analyse</p>
          <h2 id="details-heading">Link-Details</h2>
        </div>
        <span class="status-pill">Bereit</span>
      </div>
      <div class="details-layout">
        <div class="thumbnail" aria-label="Thumbnail Platzhalter">
          <span>${escapeHtml(details.thumbnailLabel)}</span>
        </div>
        <dl class="details-list">
          <div><dt>Plattform</dt><dd>${escapeHtml(details.platform)}</dd></div>
          <div><dt>Titel</dt><dd>${escapeHtml(details.title)}</dd></div>
          <div><dt>Kanal / Benutzer</dt><dd>${escapeHtml(details.creator)}</dd></div>
          <div><dt>Video-ID</dt><dd>${escapeHtml(details.videoId)}</dd></div>
          <div><dt>Dauer</dt><dd>${escapeHtml(details.duration)}</dd></div>
          <div><dt>Erwartete Ausgabe</dt><dd>${escapeHtml(details.expectedOutput)}</dd></div>
          <div><dt>Cookies</dt><dd>${escapeHtml(details.cookiesHint)}</dd></div>
        </dl>
      </div>
    </section>
  `;
}
