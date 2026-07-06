import { APP_NAME } from "../config/defaults";

export function renderTopbar(): string {
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">${APP_NAME}</p>
        <h1>Downloads vorbereiten</h1>
      </div>
      <nav class="topnav" aria-label="Hauptmenü">
        <button class="ghost-button" data-action="settings" type="button">Einstellungen</button>
        <button class="ghost-button" data-action="help" type="button">Hilfe</button>
      </nav>
    </header>
  `;
}
