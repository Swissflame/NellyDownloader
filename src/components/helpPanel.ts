import { helpChapters } from "../data/helpContent";
import { UI_ASSETS } from "../config/assets";
import { escapeHtml } from "../utils/html";

export function renderHelpPanel(visible: boolean, searchQuery: string): string {
  if (!visible) {
    return "";
  }

  return `
    <div class="settings-backdrop" data-help-panel>
      ${renderHelpContent(searchQuery, "panel compact-panel help-panel", false)}
    </div>
  `;
}

export function renderHelpWindow(searchQuery: string): string {
  return `
    <main class="standalone-window help-window-shell" data-help-panel>
      ${renderHelpContent(searchQuery, "panel help-window-panel", true)}
    </main>
  `;
}

function renderHelpContent(searchQuery: string, panelClass: string, closeWithWindow: boolean): string {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleChapters = normalizedQuery
    ? helpChapters.filter((chapter) => chapterMatches(chapter, normalizedQuery))
    : helpChapters;
  const chapterContent = visibleChapters.length > 0
    ? visibleChapters.map((chapter) => `
      <article class="help-chapter" id="help-${escapeHtml(chapter.id)}">
        <h3>${highlightText(chapter.title, normalizedQuery)}</h3>
        ${chapter.body.map((paragraph) => `<p>${highlightText(paragraph, normalizedQuery)}</p>`).join("")}
        ${chapter.table ? renderHelpTable(chapter.table, normalizedQuery) : ""}
      </article>
    `).join("")
    : `<div class="folder-message">Keine passenden Hilfethemen gefunden. Versuche ein anderes Stichwort.</div>`;

  return `
      <section class="${panelClass}" aria-labelledby="help-heading" role="dialog" aria-modal="true">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Handbuch</p>
            <h2 id="help-heading">Hilfe</h2>
          </div>
          <button class="ghost-button" type="button" data-action="${closeWithWindow ? "close-window" : "close-help"}">Schliessen</button>
        </div>
        <div class="help-hero">
          <img src="${UI_ASSETS.helpBanner}" alt="" />
          <p>NellyDownloader arbeitet lokal mit einem gewaehlten Zielordner, sicheren Dateiaktionen und optionaler WhatsApp-Kompatibilitaet.</p>
        </div>
        <label class="help-search">
          <span class="visually-hidden">Hilfe durchsuchen</span>
          <input data-help-search type="search" value="${escapeHtml(searchQuery)}" placeholder="Hilfe durchsuchen" autocomplete="off" />
        </label>
        <div class="help-layout">
          <nav class="help-toc" aria-label="Hilfekapitel">
            ${visibleChapters.map((chapter) => `
              <a href="#help-${escapeHtml(chapter.id)}">${highlightText(chapter.title, normalizedQuery)}</a>
            `).join("")}
          </nav>
          <div class="help-content">
            ${chapterContent}
          </div>
        </div>
      </section>
  `;
}

function chapterMatches(chapter: typeof helpChapters[number], query: string): boolean {
  const haystack = [
    chapter.title,
    ...chapter.body,
    ...chapter.keywords,
    ...(chapter.table?.headers ?? []),
    ...(chapter.table?.rows.flat() ?? []),
  ].join(" ").toLowerCase();

  return haystack.includes(query);
}

function highlightText(text: string, query: string): string {
  const escapedText = escapeHtml(text);

  if (!query) {
    return escapedText;
  }

  const escapedQuery = escapeRegExp(escapeHtml(query));
  return escapedText.replace(new RegExp(`(${escapedQuery})`, "gi"), "<mark>$1</mark>");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHelpTable(table: NonNullable<typeof helpChapters[number]["table"]>, query: string): string {
  return `
    <div class="help-table" role="table">
      <div role="row">
        <strong role="columnheader">${highlightText(table.headers[0], query)}</strong>
        <strong role="columnheader">${highlightText(table.headers[1], query)}</strong>
      </div>
      ${table.rows.map((row) => `
        <div role="row">
          <kbd role="cell">${highlightText(row[0], query)}</kbd>
          <span role="cell">${highlightText(row[1], query)}</span>
        </div>
      `).join("")}
    </div>
  `;
}
