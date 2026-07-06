# Technische Entscheidungen

## Entscheidung 1: Electron als Desktop-Grundlage

Begruendung:

- die bestehende Vite/TypeScript-GUI kann direkt weiterverwendet werden
- Desktop-Fenster, Preload und IPC lassen sich sauber trennen
- Node-nahe lokale Funktionen passen gut zu spaeteren Datei- und Prozess-Workflows
- Windows und macOS koennen mit einer gemeinsamen UI bedient werden
- der Renderer bleibt trotzdem als normales Vite-Frontend startbar

## Entscheidung 2: Sichere Trennung von Renderer, Main und Preload

Begruendung:

- der Renderer bekommt keinen direkten Node-Zugriff
- `contextIsolation` ist aktiv
- `nodeIntegration` ist deaktiviert
- `sandbox` ist aktiv
- lokale Funktionen werden nur ueber `contextBridge` und IPC sichtbar gemacht

## Entscheidung 3: ffmpeg bleibt extern

Begruendung:

- ffmpeg ist bereits hochoptimiert
- Integration als Library waere aufwendig
- Lizenz- und Build-Komplexitaet bleibt geringer
- externe Binary kann einfach aktualisiert werden
- Performancegewinn durch Integration waere voraussichtlich gering

## Entscheidung 4: yt-dlp bleibt extern

Begruendung:

- Plattformen aendern sich haeufig
- yt-dlp wird laufend gepflegt
- eigene Implementierung waere unverhaeltnismaessig
- Electron Main kann spaeter den Prozessstart kapseln

## Entscheidung 5: WhatsApp-Ausgabe ueber Temp

Begruendung:

- Zielordner bleibt sauber
- Benutzer sieht nur die fertige Datei
- Original-Zwischendateien koennen entfernt werden

## Entscheidung 6: Windows-Version als funktionale Referenz

Begruendung:

- bestehende Windows-Version funktioniert gut
- Workflow ist bestaetigt
- Mac-Version muss technisch aufholen
