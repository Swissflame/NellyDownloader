import { renderApp, bindApp } from "./components/app";
import { showDialog } from "./components/dialog";
import { initialState } from "./data/demoState";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App-Container wurde nicht gefunden.");
}

app.innerHTML = renderApp(initialState);
bindApp();

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
  showDialog({ title, text });
});

document.addEventListener("nelly:placeholder-action", (event) => {
  const placeholderEvent = event as CustomEvent<{ action: string }>;
  const status = document.querySelector<HTMLElement>("[data-status]");

  if (placeholderEvent.detail.action === "download" && status) {
    status.textContent = "Download-Funktion noch nicht eingebaut";
  }

  showDialog({
    title: "Download noch nicht aktiv",
    text: "Das Grundgerüst startet bereits. Die echte Download-Funktion folgt in einem späteren Schritt.",
  });
});
