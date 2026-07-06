import type { DialogMessage } from "../types/app";

type ConfirmMessage = DialogMessage & {
  confirmText: string;
  cancelText: string;
  danger?: boolean;
};

export function renderDialog(): string {
  return `
    <dialog class="app-dialog" data-dialog>
      <form method="dialog">
        <h2 data-dialog-title>Hinweis</h2>
        <p data-dialog-text>Diese Funktion wird in einem spaeteren Schritt umgesetzt.</p>
        <div class="dialog-actions" data-dialog-actions>
          <button class="primary-button" value="close" data-dialog-close>Schliessen</button>
        </div>
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
  resetDialogActions();
  dialog.showModal();
}

export function showConfirmDialog(message: ConfirmMessage): Promise<boolean> {
  const dialog = document.querySelector<HTMLDialogElement>("[data-dialog]");
  const dialogTitle = document.querySelector<HTMLElement>("[data-dialog-title]");
  const dialogText = document.querySelector<HTMLElement>("[data-dialog-text]");
  const dialogActions = document.querySelector<HTMLElement>("[data-dialog-actions]");

  if (!dialog || !dialogTitle || !dialogText || !dialogActions) {
    return Promise.resolve(false);
  }

  dialogTitle.textContent = message.title;
  dialogText.textContent = message.text;
  dialogActions.innerHTML = `
    <button class="secondary-button" value="cancel" data-confirm-cancel>${message.cancelText}</button>
    <button class="${message.danger ? "danger-button" : "primary-button"}" value="confirm" data-confirm-ok>${message.confirmText}</button>
  `;

  return new Promise((resolve) => {
    const handleClose = () => {
      dialog.removeEventListener("close", handleClose);
      const confirmed = dialog.returnValue === "confirm";
      resetDialogActions();
      resolve(confirmed);
    };

    dialog.addEventListener("close", handleClose);
    dialog.showModal();
  });
}

function resetDialogActions(): void {
  const dialogActions = document.querySelector<HTMLElement>("[data-dialog-actions]");

  if (!dialogActions) {
    return;
  }

  dialogActions.innerHTML = `<button class="primary-button" value="close" data-dialog-close>Schliessen</button>`;
}
