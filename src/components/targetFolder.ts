import type { OutputFile, TargetFolderState } from "../types/app";
import { escapeHtml } from "../utils/html";

export function renderTargetFolder(folderState: TargetFolderState, targetFolder: string): string {
  const fileContent = folderState.files.length > 0
    ? folderState.files.map(fileRow).join("")
    : `<div class="folder-message">${escapeHtml(folderState.message ?? "Der Zielordner ist leer.")}</div>`;

  return `
    <section class="panel target-panel" aria-labelledby="target-heading">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Zielordner</p>
          <h2 id="target-heading">Zielordner-Inhalt</h2>
        </div>
        <button class="ghost-button" type="button" data-action="refresh">Aktualisieren</button>
      </div>
      <div class="folder-path">${escapeHtml(targetFolder)}</div>
      <div class="file-list" role="list" aria-label="Dateien im Zielordner">
        ${fileContent}
      </div>
      <div class="file-actions">
        <button class="secondary-button" type="button" data-action="copy">Ausgewählte kopieren</button>
        <button class="danger-button" type="button" data-action="delete">Ausgewählte löschen</button>
      </div>
    </section>
  `;
}

function fileRow(file: OutputFile): string {
  const checked = file.selected ? "checked" : "";

  return `
    <label class="file-row" role="listitem">
      <input type="checkbox" ${checked} data-file-id="${escapeHtml(file.id)}" />
      <span class="file-name">${escapeHtml(file.name)}</span>
      <span>${escapeHtml(file.size)}</span>
      <span>${escapeHtml(file.date)}</span>
      <span class="file-type">${escapeHtml(file.type)}</span>
    </label>
  `;
}
