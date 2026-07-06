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

## Hilfe / Benutzerhandbuch

Der Hilfe-Bereich ist ein durchsuchbares Handbuch im Renderer. Die Inhalte werden in `src/data/helpContent.ts` gepflegt und von `src/components/helpPanel.ts` gerendert.

Die Suche filtert Kapitel nach Titel, Text und Stichworten. Treffer werden im sichtbaren Text markiert. Wenn kein Kapitel passt, zeigt die UI eine freundliche Leermeldung.

## Tastenkombinationen

App-interne Tastenkombinationen werden im Renderer ueber einen zentralen Keydown-Dispatcher verarbeitet. Die Belegung liegt in `src/config/shortcuts.ts` und wird als `keyboardShortcuts` in `AppSettings` vorbereitet.

Shortcuts loesen bestehende Funktionen aus:

- Ctrl+Enter nutzt denselben Downloadworkflow wie der Download-Button
- Ctrl+Shift+V nutzt denselben Ablauf wie Rechtsklick auf den Download-Button
- F5 aktualisiert den Zielordner
- Ctrl+, oeffnet Einstellungen
- F1 oeffnet Hilfe
- Ctrl+I oeffnet Info
- Ctrl+Shift+C nutzt die bestehende Kopierfunktion
- Delete nutzt die bestehende Papierkorb-Funktion mit Sicherheitsabfrage
- Esc schliesst offene Dialoge
- Ctrl+A waehlt Dateien nur aus, wenn keine Texteingabe fokussiert ist

Normale Texteingaben werden geschuetzt. Dadurch koennen externe Bediengeraete wie Logitech-Tasten auf diese Kombinationen gelegt werden, ohne neue Datei- oder Downloadlogik einzufuehren.

## Zielordner-Layout

Der Zielordnerbereich bleibt Teil des Renderers. Die Dateiliste selbst hat eine eigene Maximalhoehe und scrollt intern, damit Link, Analyse, Fortschritt und Dateiaktions-Buttons moeglichst sichtbar bleiben.

## Assets und Grafiken

Grafiken und Icons liegen zentral im Projektordner `assets/`:

- `assets/icons` enthaelt das Windows-Fenstericon und PNG-Favicons
- `assets/about` enthaelt Bilder fuer den Info-Dialog
- `assets/ui` enthaelt Hintergrund, Kopfbereich, Hilfe-Banner und Empty-State der App
- `assets/readme` enthaelt die GitHub-/README-Vorschau
- `assets/installer` enthaelt vorbereitete Installer-Grafiken
- `assets/source` enthaelt die Master-Grafik fuer das App-Icon

Der Renderer bindet diese Dateien ueber Vites `publicDir: "../assets"` ein. Dadurch koennen UI-Grafiken wie `/ui/app-background.png`, `/ui/help-banner.png` und `/ui/empty-files.png` verwendet werden, ohne Bilder nach `src/` zu duplizieren.

Der Electron Main-Prozess setzt das Fenstericon ueber eine kleine Asset-Pfad-Hilfe aus `src/electron/assetPaths.ts`. Der Pfad basiert auf dem Projektroot und verwendet keine absoluten Entwicklerpfade.

Das Installer-Icon wird fuer den NSIS-Build verwendet. Header- und Sidebar-Grafiken sind vorbereitet, werden aber noch nicht eingebunden, weil die aktuelle NSIS-Konfiguration nur sichere Icon-Assets nutzt.

## Packaging / Windows-Installer

Der Windows-Installer wird mit `electron-builder` aus dem `src`-Projekt erzeugt.

Wichtige Punkte:

- App- und Produktname: `NellyDownloader`
- Installer-Ziel: NSIS fuer Windows x64
- Ausgabeordner: `src/release/`
- Windows-App-Icon: `assets/icons/app-icon.ico`
- Installer-Icon: `assets/installer/installer-icon.ico`
- Startmenue- und Desktop-Verknuepfung werden erzeugt

Der installierte Build nutzt das Icon als `extraResources` unter `resources/assets/icons/app-icon.ico`. Die Renderer-Assets werden weiterhin durch den Vite-Build in `dist/` bereitgestellt.

`yt-dlp`, `ffmpeg` und `ffprobe` werden in diesem Schritt noch nicht als Installer-Resources mitgeliefert. Die aktuelle Toolsuche bleibt unveraendert: gespeicherter Pfad, Entwicklungsreferenz unter `reference/Windows` und danach `PATH`.

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
- Link-Metadaten mit `yt-dlp` analysieren
- spaeter weitere lokale Betriebssystemfunktionen kapseln
- externe Tools wie `yt-dlp`, `ffmpeg` und `ffprobe` starten

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
- `readClipboardText()`
- `getSettings()`
- `saveSettings(settings)`
- `selectTargetFolder()`
- `listTargetFolder()`
- `copySelectedFiles(fileIds)`
- `deleteSelectedFiles(fileIds)`
- `analyzeLink(url)`
- `startDownload(url)`

`getSettings`, `saveSettings`, `selectTargetFolder`, `listTargetFolder`, `analyzeLink`, `startDownload`, `copySelectedFiles` und `deleteSelectedFiles` arbeiten bereits lokal.

## Link-Analyse

Die Link-Analyse laeuft im Electron Main-Prozess. Der Renderer uebergibt nur die URL ueber `window.nelly.analyzeLink(url)`.

Der Download-Button hat zwei Bedienwege: Linksklick nutzt den eingetragenen Link, Rechtsklick liest ueber die Preload-API nur Text aus der System-Zwischenablage. Der Renderer akzeptiert daraus nur http- und https-URLs und startet danach denselben Downloadworkflow wie beim normalen Klick.

Sicherheitsregeln:

- nur `http://` und `https://` URLs werden akzeptiert
- `yt-dlp` wird mit `spawn` ohne Shell gestartet
- es wird nur der Info-Modus verwendet: `--dump-json --no-playlist --skip-download`
- es werden keine Mediendateien heruntergeladen
- es werden keine Dateien im Zielordner erzeugt
- die Analyse hat ein Timeout von 60 Sekunden
- Instagram-Links werden vor der Analyse von typischen Tracking-Parametern bereinigt
- bei Instagram werden je nach Cookie-Modus Browser-Cookies oder `cookies.txt` versucht
- bei Browser `Automatisch` werden mehrere Browser nacheinander versucht

`yt-dlp` wird in dieser Reihenfolge gesucht:

1. gespeicherter Pfad aus den Einstellungen
2. unter Windows die Entwicklungsreferenz `reference/Windows/yt-dlp.exe`
3. `yt-dlp` oder `yt-dlp.exe` aus dem `PATH`

`reference/` wird dabei nur gelesen und nicht veraendert.

## Einzel-Download

Der Download laeuft im Electron Main-Prozess. Der Renderer startet ihn nur ueber `window.nelly.startDownload(url)` und erhaelt Fortschritt ueber die Preload-API.

Der Downloadmodus wird in den Einstellungen gespeichert:

- `Automatisch`: wenn der Link bereits analysiert ist, werden die vorhandenen Details verwendet; sonst startet direkt der Download
- `Erst analysieren, dann herunterladen`: der bisherige sichere Ablauf mit Analyse vor dem Download
- `Direkt herunterladen`: keine separate Analyse vor dem Download

Der Renderer startet Analyse und Download sequenziell. Es werden nicht zwei yt-dlp-Prozesse parallel fuer denselben Link gestartet.

Aktuelle Regeln:

- es wird genau ein Link verarbeitet
- Playlists sind mit `--no-playlist` deaktiviert
- `yt-dlp` wird mit `spawn` ohne Shell gestartet
- Zielordner kommt aus den gespeicherten Einstellungen
- bestehende Dateien werden mit `--no-overwrites` nicht ueberschrieben
- der Ausgabename enthaelt Titel, Video-ID und einen Laufzeit-Zeitstempel
- MP4/H.264/AAC wird ueber Sortierung bevorzugt
- Instagram nutzt dieselbe Browser-Cookie-Strategie wie die Analyse
- Kopieren und Loeschen bleiben deaktiviert

Der Renderer zeigt Download-Fortschritt aus der yt-dlp-Ausgabe an. Eine moegliche Zusammenfuehrung durch yt-dlp wird als vorlaeufiger Umwandlungs-/Zusammenfuehrungsstatus dargestellt. Eine eigene ffmpeg-Konvertierung startet nur je nach WhatsApp-Kompatibilitaetsmodus.

## WhatsApp-Kompatibilitaet

Nach dem Download kann die Datei mit `ffprobe` geprueft werden. Kompatibel ist:

- Container `mp4` oder `mov`
- Video-Codec `h264`
- Audio-Codec `aac` oder kein Audio

Der Modus wird in den Einstellungen gespeichert:

- `Auto`: kompatible Dateien bleiben unveraendert, sonst wird mit `ffmpeg` nach MP4/H.264/AAC konvertiert
- `Immer umwandeln`: es wird immer eine neue WhatsApp-MP4 erzeugt
- `Nie umwandeln`: es wird keine ffmpeg-Konvertierung gestartet

Originaldateien werden bei der Umwandlung vorerst behalten und nicht geloescht.

Die Einstellung `Originaldatei nach Umwandlung` steuert das Verhalten nach einer erfolgreichen ffmpeg-Konvertierung:

- `Behalten` ist der Standard und laesst Original und WhatsApp-MP4 im Zielordner
- `Nach erfolgreicher Umwandlung in Papierkorb verschieben` verschiebt nur die durch den aktuellen Download entstandene Originaldatei in den Papierkorb

Das Verschieben passiert nur, wenn eine zusaetzliche MP4 erzeugt wurde, diese Datei existiert, groesser als 0 Byte ist, mit `ffprobe` lesbar und kompatibel ist, und Original sowie MP4 im aktuellen Zielordner liegen. Es wird `shell.trashItem` verwendet; bei Fehlern bleibt das Original erhalten.

`ffprobe` und `ffmpeg` werden in dieser Reihenfolge gesucht:

1. gespeicherter Pfad aus den Einstellungen
2. unter Windows die Entwicklungsreferenz `reference/Windows/ffprobe.exe` bzw. `reference/Windows/ffmpeg.exe`
3. `ffprobe` oder `ffmpeg` aus dem `PATH`

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

## Dateien Kopieren

`Ausgewaehlte kopieren` ist aktiv. Der Renderer sendet nur die Dateinamen der ausgewaehlten Zielordner-Dateien. Der Main-Prozess prueft:

- mindestens eine Datei wurde ausgewaehlt
- jede Auswahl ist ein Dateiname und kein freier Pfad
- die Datei liegt im aktuell gespeicherten Zielordner
- die Datei existiert
- die Datei ist eine normale Datei und kein Ordner

Unter Windows wird zuerst versucht, die Dateien als echte CF_HDROP/FileDropList in die Zwischenablage zu legen. Dafuer startet der Main-Prozess `powershell.exe` mit `-NoProfile`, `-NonInteractive`, `-STA` und einer festen .NET-Clipboard-Routine. Dateipfade werden nicht in PowerShell-Code interpoliert, sondern als Base64-kodiertes JSON ueber eine Umgebungsvariable uebergeben.

Wenn die Dateiablage nicht verfuegbar ist oder auf anderen Plattformen, werden die vollstaendigen Dateipfade als Text in die Zwischenablage geschrieben und die GUI meldet diesen Fallback klar.

Beim Kopieren werden Dateien nicht veraendert, nicht verschoben und nicht geloescht.

## Dateien In Den Papierkorb Verschieben

`Ausgewaehlte loeschen` verschiebt Dateien nach Sicherheitsabfrage in den Papierkorb. Es gibt keine permanente Loeschfunktion.

Der Renderer sendet nur Dateinamen aus der aktuellen Zielordner-Liste. Der Main-Prozess prueft Zielordner, Existenz, normale Datei und dass kein Pfad ausserhalb des Zielordners liegt. Unterordner werden nicht akzeptiert. Das Verschieben erfolgt ueber `shell.trashItem`; bei Fehlern bleiben betroffene Dateien erhalten und die GUI zeigt eine verstaendliche Meldung.

## Lokale Workflows

Der spaetere Download-Workflow bleibt unveraendert als Zielbild:

1. Link wird eingegeben
2. Link-Analyse mit `yt-dlp` JSON
3. Details werden angezeigt
4. Benutzer startet den Einzel-Download
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

Der eigentliche Download ist fuer einzelne Links aktiv. WhatsApp-Temp-Workflow und eigene Konvertierung sind noch nicht aktiv.

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
