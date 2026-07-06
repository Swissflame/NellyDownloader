# Architektur – Nelly Downloader

## Überblick

Die App besteht aus drei Schichten:

1. UI-Schicht
2. App-Backend / Tauri Commands
3. Core-Logik

## UI-Schicht

Technologie:

- HTML
- CSS
- TypeScript
- Tauri WebView

Aufgaben:

- Menüs anzeigen
- Link-Eingabe
- Details anzeigen
- Fortschrittsbalken
- Zielordner-Dateiliste
- Einstellungen
- Hilfe

Die UI enthält möglichst wenig Business-Logik.

## Tauri Commands

Kommunikation zwischen UI und Rust.

Beispiele:

- `analyze_link(url)`
- `start_download(url, options)`
- `cancel_download(job_id)`
- `get_settings()`
- `save_settings(settings)`
- `list_target_folder()`
- `copy_selected_files(files)`
- `delete_selected_files(files)`
- `open_target_folder()`
- `check_tools()`
- `update_tool(tool_name)`
- `get_help_index()`
- `search_help(query)`

## Rust Core

Module:

```text
src-tauri/src/
├── main.rs
├── config.rs
├── tools.rs
├── downloader.rs
├── ffmpeg.rs
├── folders.rs
├── clipboard.rs
├── platform/
│   ├── mod.rs
│   ├── windows.rs
│   └── macos.rs
├── help.rs
├── logging.rs
└── models.rs
```

## Konfiguration

Speicherort:

- Windows: `%APPDATA%/NellyDownloader/config.json`
- macOS: `~/Library/Application Support/NellyDownloader/config.json`

Tool-Ordner:

- Windows: `%LOCALAPPDATA%/NellyDownloader/tools`
- macOS: `~/Library/Application Support/NellyDownloader/tools`

Temp-Ordner:

- Windows: `%LOCALAPPDATA%/NellyDownloader/temp`
- macOS: `~/Library/Caches/NellyDownloader/temp`

## Download-Workflow

1. Link wird eingegeben
2. Link-Analyse mit yt-dlp JSON
3. Details werden angezeigt
4. Benutzer startet Download
5. Zielordner wird geöffnet/aktualisiert
6. Falls WhatsApp aktiv:
   - Download in Temp
   - ffprobe analysiert Ergebnis
   - falls nötig ffmpeg-Konvertierung
   - finale Datei in Zielordner
   - Temp aufräumen
7. Falls WhatsApp aus:
   - direkter Download in Zielordner
8. Dateiliste aktualisieren

## Performance auf macOS

Zu vermeiden:

- teure Tool-Prüfung bei jedem Start
- unnötige Finder AppleScript-Abfragen
- dauerndes Auslesen von Browser-Cookies
- Shellscript-Overhead
- blockierende UI

Strategien:

- Tool-Versionen cachen
- Tool-Check asynchron
- Finder-Öffnung einfach über native API oder `open`, nicht vorher langsam prüfen
- Download/ffmpeg in Hintergrundprozess
- Fortschrittsausgabe streamen
- Logs nicht synchron übermäßig schreiben

## Fehlerbehandlung

Fehler immer auf Deutsch anzeigen.
