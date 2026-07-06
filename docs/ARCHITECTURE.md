# Architektur - Nelly Downloader

## Ueberblick

Die App besteht aktuell aus drei klar getrennten Bereichen:

1. Renderer / UI
2. Electron Main-Prozess
3. Electron Preload-Bruecke

Spaetere lokale Funktionen wie Link-Analyse, Download, Tool-Verwaltung und Dateiaktionen werden nicht direkt im Renderer ausgefuehrt. Der Renderer bleibt eine Vite/TypeScript-Oberflaeche und spricht nur ueber die Preload-API mit dem lokalen Desktop-Teil.

## Renderer / UI

Technologie:

- HTML
- CSS
- TypeScript
- Vite

Aufgaben:

- Menues anzeigen
- Link-Eingabe
- Link-Details anzeigen
- Fortschrittsbalken anzeigen
- Zielordner-Dateiliste anzeigen
- Einstellungen anzeigen
- Hilfe anzeigen

Die UI enthaelt moeglichst wenig Business-Logik. Komponenten liegen unter `src/components`, zentrale Typen unter `src/types`, Standardwerte unter `src/config`.

## Electron Main-Prozess

Datei:

- `src/electron/main.ts`

Aufgaben:

- Desktop-Fenster erstellen
- sichere WebPreferences setzen
- IPC-Handler registrieren
- spaeter lokale Betriebssystemfunktionen kapseln
- spaeter externe Tools wie `yt-dlp`, `ffmpeg` und `ffprobe` starten

Sicherheit:

- `contextIsolation` ist aktiv
- `nodeIntegration` ist deaktiviert
- `sandbox` ist aktiv
- Renderer-Zugriff auf lokale Funktionen laeuft nur ueber Preload und IPC

## Electron Preload

Datei:

- `src/electron/preload.ts`

Der Preload stellt ueber `contextBridge` die globale API `window.nelly` bereit. Diese API ist aktuell nur vorbereitet und fuehrt noch keine gefaehrlichen Aktionen aus.

Vorbereitete Methoden:

- `getAppVersion()`
- `getSettings()`
- `saveSettings(settings)`
- `selectTargetFolder()`
- `listTargetFolder()`
- `copySelectedFiles(fileIds)`
- `deleteSelectedFiles(fileIds)`
- `analyzeLink(url)`
- `startDownload(url)`

## Lokale Workflows

Der spaetere Download-Workflow bleibt unveraendert als Zielbild:

1. Link wird eingegeben
2. Link-Analyse mit `yt-dlp` JSON
3. Details werden angezeigt
4. Benutzer startet Download
5. Zielordner wird geoeffnet oder aktualisiert
6. Falls WhatsApp aktiv:
   - Download in Temp
   - Analyse mit `ffprobe`
   - falls noetig Konvertierung mit `ffmpeg`
   - finale Datei in Zielordner
   - Temp aufraeumen
7. Falls WhatsApp aus:
   - direkter Download in Zielordner
8. Dateiliste aktualisieren

## Konfiguration

Geplante Speicherorte:

- Windows: `%APPDATA%/NellyDownloader/config.json`
- macOS: `~/Library/Application Support/NellyDownloader/config.json`

Tool-Ordner:

- Windows: `%LOCALAPPDATA%/NellyDownloader/tools`
- macOS: `~/Library/Application Support/NellyDownloader/tools`

Temp-Ordner:

- Windows: `%LOCALAPPDATA%/NellyDownloader/temp`
- macOS: `~/Library/Caches/NellyDownloader/temp`

## Performance auf macOS

Zu vermeiden:

- teure Tool-Pruefung bei jedem Start
- unnoetige Finder AppleScript-Abfragen
- dauerndes Auslesen von Browser-Cookies
- blockierende UI

Strategien:

- Tool-Versionen cachen
- Tool-Check asynchron
- Finder-Oeffnung ueber native API oder `open`
- Download/ffmpeg in Hintergrundprozess
- Fortschrittsausgabe streamen
- Logs nicht synchron uebermaessig schreiben

## Fehlerbehandlung

Fehler immer auf Deutsch anzeigen.
