import type { DownloadProgress } from "../types/app";

export function renderProgressPanel(progress: DownloadProgress): string {
  return `
    <section class="panel progress-panel" aria-labelledby="progress-heading">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Workflow</p>
          <h2 id="progress-heading">Fortschritt</h2>
        </div>
        <span class="status-text" data-status>${progress.status}</span>
      </div>
      <div class="progress-stack">
        ${progressRow("Gesamtfortschritt", progress.total)}
        ${progressRow("Fortschritt Download", progress.download)}
        ${progressRow("Fortschritt Umwandlung", progress.conversion)}
      </div>
    </section>
  `;
}

function progressRow(label: string, value: number): string {
  return `
    <div class="progress-row">
      <div class="progress-label">
        <span>${label}</span>
        <strong>${value}%</strong>
      </div>
      <progress max="100" value="${value}" aria-label="${label}"></progress>
    </div>
  `;
}
