export function renderHelpPanel(): string {
  return `
    <section class="panel compact-panel" aria-labelledby="help-heading" hidden>
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Handbuch</p>
          <h2 id="help-heading">Hilfe</h2>
        </div>
      </div>
      <div class="help-layout">
        <label>
          <span class="visually-hidden">Hilfe durchsuchen</span>
          <input type="search" placeholder="Hilfe durchsuchen" disabled />
        </label>
        <p class="muted">Die Kapitelstruktur ist vorbereitet. Inhalte folgen in einem späteren Schritt.</p>
      </div>
    </section>
  `;
}
