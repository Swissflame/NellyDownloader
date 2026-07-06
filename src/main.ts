import "./styles.css";

type TargetFile = {
  id: string;
  name: string;
  size: string;
  date: string;
  type: string;
  selected: boolean;
};

const targetFiles: TargetFile[] = [
  {
    id: "video-1",
    name: "Beispielvideo_Instagram_2026-07-06.mp4",
    size: "12 MB",
    date: "06.07.2026",
    type: "MP4",
    selected: true,
  },
  {
    id: "video-2",
    name: "Schulprojekt_YouTube_Ausschnitt.mp4",
    size: "18 MB",
    date: "05.07.2026",
    type: "MP4",
    selected: false,
  },
  {
    id: "audio-1",
    name: "Interview_TikTok_Audio.m4a",
    size: "4 MB",
    date: "04.07.2026",
    type: "Audio",
    selected: false,
  },
];

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App-Container wurde nicht gefunden.");
}

app.innerHTML = `
  <main class="shell" aria-label="Nelly Downloader">
    <header class="topbar">
      <div>
        <p class="eyebrow">Nelly Downloader</p>
        <h1>Downloads vorbereiten</h1>
      </div>
      <nav class="topnav" aria-label="Hauptmenü">
        <button class="ghost-button" data-action="settings" type="button">Einstellungen</button>
        <button class="ghost-button" data-action="help" type="button">Hilfe</button>
      </nav>
    </header>

    <section class="link-panel" aria-labelledby="link-heading">
      <div>
        <h2 id="link-heading">Link</h2>
        <p class="muted">Füge einen erlaubten Video- oder Audiolink ein.</p>
      </div>
      <form class="link-form">
        <label class="visually-hidden" for="download-link">Link eingeben</label>
        <input id="download-link" name="download-link" type="url" placeholder="https://..." autocomplete="off" />
        <button class="primary-button" type="submit">Download starten</button>
      </form>
    </section>

    <div class="content-grid">
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
            <span>Vorschau</span>
          </div>
          <dl class="details-list">
            <div><dt>Plattform</dt><dd>Noch nicht analysiert</dd></div>
            <div><dt>Titel</dt><dd>-</dd></div>
            <div><dt>Kanal / Benutzer</dt><dd>-</dd></div>
            <div><dt>Video-ID</dt><dd>-</dd></div>
            <div><dt>Erwartete Ausgabe</dt><dd>MP4, H.264 bevorzugt</dd></div>
          </dl>
        </div>
      </section>

      <section class="panel progress-panel" aria-labelledby="progress-heading">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Workflow</p>
            <h2 id="progress-heading">Fortschritt</h2>
          </div>
          <span class="status-text" data-status>Wartet auf Eingabe</span>
        </div>
        <div class="progress-stack">
          ${progressRow("Gesamtfortschritt", 0)}
          ${progressRow("Fortschritt Download", 0)}
          ${progressRow("Fortschritt Umwandlung", 0)}
        </div>
      </section>
    </div>

    <section class="panel target-panel" aria-labelledby="target-heading">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Zielordner</p>
          <h2 id="target-heading">Zielordner-Inhalt</h2>
        </div>
        <button class="ghost-button" type="button" data-action="refresh">Aktualisieren</button>
      </div>
      <div class="folder-path">C:\\Users\\Public\\Videos\\NellyDownloads</div>
      <div class="file-list" role="list" aria-label="Dateien im Zielordner">
        ${targetFiles.map(fileRow).join("")}
      </div>
      <div class="file-actions">
        <button class="secondary-button" type="button" data-action="copy">Ausgewählte kopieren</button>
        <button class="danger-button" type="button" data-action="delete">Ausgewählte löschen</button>
      </div>
    </section>

    <dialog class="app-dialog" data-dialog>
      <form method="dialog">
        <h2 data-dialog-title>Hinweis</h2>
        <p data-dialog-text>Diese Funktion wird in einem späteren Schritt umgesetzt.</p>
        <button class="primary-button" value="close">Schließen</button>
      </form>
    </dialog>
  </main>
`;

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

function fileRow(file: TargetFile): string {
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

const dialog = document.querySelector<HTMLDialogElement>("[data-dialog]");
const dialogTitle = document.querySelector<HTMLElement>("[data-dialog-title]");
const dialogText = document.querySelector<HTMLElement>("[data-dialog-text]");
const status = document.querySelector<HTMLElement>("[data-status]");

document.querySelector<HTMLFormElement>(".link-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  showMessage("Download noch nicht aktiv", "Das Grundgerüst startet bereits. Die echte Download-Funktion folgt in einem späteren Schritt.");
  if (status) {
    status.textContent = "Download-Funktion noch nicht eingebaut";
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;

  if (!action) {
    return;
  }

  const messages: Record<string, [string, string]> = {
    settings: ["Einstellungen", "Das Einstellungsfenster wird in einem späteren Schritt umgesetzt."],
    help: ["Hilfe", "Das Hilfe-System wird in einem späteren Schritt umgesetzt."],
    refresh: ["Aktualisieren", "Die Zielordner-Liste ist aktuell noch ein Platzhalter."],
    copy: ["Kopieren", "Dateien kopieren wird erst mit der Backend-Anbindung aktiviert."],
    delete: ["Löschen", "Dateien löschen wird erst mit der Backend-Anbindung aktiviert."],
  };

  const [title, text] = messages[action] ?? ["Hinweis", "Diese Funktion wird später umgesetzt."];
  showMessage(title, text);
});

function showMessage(title: string, text: string): void {
  if (!dialog || !dialogTitle || !dialogText) {
    return;
  }

  dialogTitle.textContent = title;
  dialogText.textContent = text;
  dialog.showModal();
}
