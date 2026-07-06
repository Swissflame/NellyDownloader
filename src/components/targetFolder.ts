import type { OutputFile } from "../types/app";

export function renderTargetFolder(files: OutputFile[], targetFolder: string): string {
  return `
    <section class="panel target-panel" aria-labelledby="target-heading">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Zielordner</p>
          <h2 id="target-heading">Zielordner-Inhalt</h2>
        </div>
        <button class="ghost-button" type="button" data-action="refresh">Aktualisieren</button>
      </div>
      <div class="folder-path">${targetFolder}</div>
      <div class="file-list" role="list" aria-label="Dateien im Zielordner">
        ${files.map(fileRow).join("")}
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
      <input type="checkbox" ${checked} data-file-id="${file.id}" />
      <span class="file-name">${file.name}</span>
      <span>${file.size}</span>
      <span>${file.date}</span>
      <span class="file-type">${file.type}</span>
    </label>
  `;
}
