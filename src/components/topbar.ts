import { APP_NAME } from "../config/defaults";
import { UI_ASSETS } from "../config/assets";

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
        <button class="ghost-button" data-action="about" type="button">Info</button>
      </nav>
    </header>
    <div class="hero-banner" aria-hidden="true">
      <img src="${UI_ASSETS.heroBanner}" alt="" />
    </div>
  `;
}
