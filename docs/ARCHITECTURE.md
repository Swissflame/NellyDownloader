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
- Einstellungen in `app.getPath("userData")/settings.json` speichern
- Zielordner ueber nativen Electron-Dialog auswaehlen
- Zielordnerinhalt lesen und als sichere Daten an den Renderer geben
- spaeter weitere lokale Betriebssystemfunktionen kapseln
- spaeter externe Tools wie `yt-dlp`, `ffmpeg` und `ffprobe` starten

Sicherheit:

- `contextIsolation` ist aktiv
- `nodeIntegration` ist deaktiviert
- `sandbox` ist aktiv
- Renderer-Zugriff auf lokale Funktionen laeuft nur ueber Preload und IPC

## Electron Preload

Datei:

- `src/electron/preload.ts`

Der Preload stellt ueber `contextBridge` die globale API `window.nelly` bereit. Der Renderer hat keinen direkten Node-Zugriff. Dateisystemzugriff findet nur im Main-Prozess statt.

API-Methoden:

- `getAppVersion()`
- `getSettings()`
- `saveSettings(settings)`
- `selectTargetFolder()`
- `listTargetFolder()`
- `copySelectedFiles(fileIds)`
- `deleteSelectedFiles(fileIds)`
- `analyzeLink(url)`
- `startDownload(url)`

`getSettings`, `saveSettings`, `selectTargetFolder` und `listTargetFolder` arbeiten bereits lokal. `copySelectedFiles`, `deleteSelectedFiles`, `analyzeLink` und `startDownload` sind absichtlich noch sichere Platzhalter.

## Zielordnerzugriff

Der gespeicherte Zielordner wird im Main-Prozess gelesen. Es werden nur normale Dateien angezeigt, keine Unterordner.

Unterstuetzte Dateitypen:

- `mp4`
- `mkv`
- `webm`
- `mov`
- `avi`
- `mp3`
- `m4a`
- `wav`
- `opus`

Der Renderer erhaelt nur strukturierte Daten mit Dateiname, Groesse, Aenderungsdatum und Typ. Wenn der Ordner leer ist oder nicht existiert, liefert der Main-Prozess eine deutschsprachige Meldung.

Kopieren und Loeschen sind sichtbar, aber absichtlich deaktiviert und fuehren keine Dateiaktionen aus.

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

Aktueller Speicherort:

- Electron `app.getPath("userData")`
- Datei: `settings.json`

Beim ersten Start werden Standardwerte verwendet. Danach wird der gewaehlt Zielordner persistent in der Settings-Datei gespeichert.

Geplante Tool- und Temp-Speicherorte:

- Windows Tool-Ordner: `%LOCALAPPDATA%/NellyDownloader/tools`
- macOS Tool-Ordner: `~/Library/Application Support/NellyDownloader/tools`
- Windows Temp-Ordner: `%LOCALAPPDATA%/NellyDownloader/temp`
- macOS Temp-Ordner: `~/Library/Caches/NellyDownloader/temp`

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
