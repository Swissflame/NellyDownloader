export function renderLinkInput(linkInput: string): string {
  return `
    <section class="link-panel" aria-labelledby="link-heading">
      <div>
        <h2 id="link-heading">Link</h2>
        <p class="muted">Füge einen erlaubten Video- oder Audiolink ein.</p>
      </div>
      <form class="link-form">
        <label class="visually-hidden" for="download-link">Link eingeben</label>
        <input id="download-link" name="download-link" type="url" value="${linkInput}" placeholder="https://..." autocomplete="off" />
        <button class="primary-button" type="submit">Download starten</button>
      </form>
    </section>
  `;
}

export function bindLinkInput(): void {
  document.querySelector<HTMLFormElement>(".link-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    document.dispatchEvent(
      new CustomEvent("nelly:placeholder-action", {
        detail: {
          action: "download",
        },
      }),
    );
  });
}
