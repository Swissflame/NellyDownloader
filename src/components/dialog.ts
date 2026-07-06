import type { DialogMessage } from "../types/app";

export function renderDialog(): string {
  return `
    <dialog class="app-dialog" data-dialog>
      <form method="dialog">
        <h2 data-dialog-title>Hinweis</h2>
        <p data-dialog-text>Diese Funktion wird in einem späteren Schritt umgesetzt.</p>
        <button class="primary-button" value="close">Schließen</button>
      </form>
    </dialog>
  `;
}

export function showDialog(message: DialogMessage): void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-dialog]");
  const dialogTitle = document.querySelector<HTMLElement>("[data-dialog-title]");
  const dialogText = document.querySelector<HTMLElement>("[data-dialog-text]");

  if (!dialog || !dialogTitle || !dialogText) {
    return;
  }

  dialogTitle.textContent = message.title;
  dialogText.textContent = message.text;
  dialog.showModal();
}
