import type { OutputFile, TargetFolderState } from "../types/app";
import { UI_ASSETS } from "../config/assets";
import { escapeHtml } from "../utils/html";

export function renderTargetFolder(folderState: TargetFolderState, targetFolder: string): string {
  const fileContent = folderState.files.length > 0
    ? folderState.files.map(fileRow).join("")
    : emptyFolderMessage(folderState);
  const fileListClass = folderState.files.length > 0 ? "file-list" : "file-list file-list-empty";

  return `
    <section class="panel target-panel" aria-labelledby="target-heading">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Zielordner</p>
          <h2 id="target-heading">Zielordner-Inhalt</h2>
        </div>
        <div class="target-heading-actions">
          <button class="ghost-button" type="button" data-action="open-target-folder">Zielordner oeffnen</button>
          <button class="ghost-button" type="button" data-action="refresh">Aktualisieren</button>
        </div>
      </div>
      <div class="folder-path">${escapeHtml(targetFolder)}</div>
      <div class="${fileListClass}" role="list" aria-label="Dateien im Zielordner" tabindex="0" data-file-list>
        ${fileContent}
      </div>
      <div class="file-actions">
        <button class="secondary-button" type="button" data-action="reveal-file">Im Explorer anzeigen</button>
        <button class="secondary-button" type="button" data-action="copy">Ausgewählte kopieren</button>
        <button class="danger-button" type="button" data-action="delete">Ausgewählte löschen</button>
      </div>
    </section>
  `;
}

function emptyFolderMessage(folderState: TargetFolderState): string {
  const message = escapeHtml(folderState.message ?? "Der Zielordner ist leer.");

  if (!folderState.folderExists) {
    return `<div class="folder-message">${message}</div>`;
  }

  return `
    <div class="folder-message empty-folder-state">
      <img src="${UI_ASSETS.emptyFiles}" alt="" />
      <p>${message}</p>
    </div>
  `;
}

function fileRow(file: OutputFile): string {
  const checked = file.selected ? "checked" : "";
  const selectedClass = file.selected ? " file-row-selected" : "";

  return `
    <label class="file-row${selectedClass}" role="listitem" data-file-row="${escapeHtml(file.id)}">
      <input type="checkbox" ${checked} data-file-id="${escapeHtml(file.id)}" />
      <span class="file-name">${escapeHtml(file.name)}</span>
      <span>${escapeHtml(file.size)}</span>
      <span>${escapeHtml(file.date)}</span>
      <span class="file-type">${escapeHtml(file.type)}</span>
    </label>
  `;
}
