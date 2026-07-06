import { escapeHtml } from "../utils/html";

export function renderLinkInput(linkInput: string, disabled: boolean): string {
  const disabledAttribute = disabled ? "disabled" : "";
  const buttonText = disabled ? "Bitte warten..." : "Download starten";

  return `
    <section class="link-panel" aria-labelledby="link-heading">
      <div>
        <h2 id="link-heading">Link</h2>
        <p class="muted">Füge einen erlaubten Video- oder Audiolink ein.</p>
      </div>
      <form class="link-form">
        <label class="visually-hidden" for="download-link">Link eingeben</label>
        <input id="download-link" name="download-link" type="url" value="${escapeHtml(linkInput)}" placeholder="https://..." autocomplete="off" ${disabledAttribute} />
        <button class="primary-button" type="submit" ${disabledAttribute}>${buttonText}</button>
      </form>
    </section>
  `;
}

export function bindLinkInput(): void {
  document.querySelector<HTMLFormElement>(".link-form")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const linkInput = form.querySelector<HTMLInputElement>("#download-link");

    document.dispatchEvent(
      new CustomEvent("nelly:placeholder-action", {
        detail: {
          action: "download",
          url: linkInput?.value ?? "",
        },
      }),
    );
  });
}
