import { renderDialog } from "./dialog";
import { renderHelpPanel } from "./helpPanel";
import { renderLinkDetails } from "./linkDetails";
import { bindLinkInput, renderLinkInput } from "./linkInput";
import { renderProgressPanel } from "./progressPanel";
import { renderSettingsPanel } from "./settingsPanel";
import { renderTargetFolder } from "./targetFolder";
import { renderTopbar } from "./topbar";
import type { AppState } from "../types/app";

export function renderApp(state: AppState): string {
  return `
    <main class="shell" aria-label="Nelly Downloader">
      ${renderTopbar()}
      ${renderLinkInput(state.linkInput)}

      <div class="content-grid">
        ${renderLinkDetails(state.linkDetails)}
        ${renderProgressPanel(state.progress)}
      </div>

      ${renderTargetFolder(state.outputFiles, state.settings.targetFolder)}
      ${renderSettingsPanel(state.settings)}
      ${renderHelpPanel()}
      ${renderDialog()}
    </main>
  `;
}

export function bindApp(): void {
  bindLinkInput();
}
