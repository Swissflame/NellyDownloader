# NellyDownloader

![NellyDownloader Vorschau](assets/readme/github-preview.png)

NellyDownloader ist eine lokale Electron-App zum Analysieren, Herunterladen und Vorbereiten einzelner Medienlinks. Die App nutzt eine Vite/TypeScript-Oberflaeche und fuehrt lokale Aufgaben wie yt-dlp, ffprobe, ffmpeg und Dateiaktionen im Electron Main-Prozess aus.

Aktueller Status: v0.1.0 Testversion / Release-Kandidat.

## Hauptfunktionen

- Link-Analyse fuer einzelne http- und https-URLs
- Einzel-Download mit yt-dlp, ohne Playlists
- Zielordner-Auswahl und echte Zielordner-Dateiliste
- Zielordner im Explorer oeffnen und einzelne Datei im Explorer anzeigen
- separat scrollbare Dateiliste fuer grosse Zielordner
- NellyDownloader-Branding mit dezentem Hintergrund, kompaktem Kopfbereich und Empty-State
- Downloadmodus: automatisch, erst analysieren, direkt herunterladen
- WhatsApp-Kompatibilitaet mit ffprobe/ffmpeg-Pruefung
- optionales Verschieben der Originaldatei in den Papierkorb nach erfolgreicher Umwandlung
- Kopieren ausgewaehlter Dateien in die System-Zwischenablage
- sicheres Verschieben ausgewaehlter Dateien in den Papierkorb
- durchsuchbares Benutzerhandbuch als eigenes Hilfe-Fenster und Info-Dialog
- frei zuordenbare app-interne Tastenkombinationen, geeignet fuer externe Bediengeraete wie Logitech-Tasten
- Tastaturfunktionen fuer die Dateiliste: auswaehlen, abwaehlen, invertieren, neueste Datei und Bewegung

## Sicherheit

- Der Renderer hat keinen direkten Node-Zugriff.
- Dateisystem und externe Prozesse laufen ueber Preload, IPC und den Electron Main-Prozess.
- Playlists werden nicht heruntergeladen.
- Bestehende Dateien werden nicht ueberschrieben.
- Dateiaktionen akzeptieren nur Dateien aus dem eingestellten Zielordner.
- Loeschen bedeutet immer Papierkorb, nicht permanente Loeschung.
- Originaldateien werden nur nach erfolgreicher Umwandlung in den Papierkorb verschoben, wenn diese Option aktiv ist.
- Shortcuts sind app-intern; es werden keine globalen Windows-Hotkeys registriert.

## Installation / Installer

Der Windows-Installer wird mit `npm run dist:win` erzeugt und liegt danach unter `src/release/`, z.B.:

```text
src/release/NellyDownloader-Setup-0.1.0.exe
```

Der Installer erstellt Startmenue- und Desktop-Verknuepfungen. Beim Deinstallieren werden Programmdateien entfernt; lokale Benutzereinstellungen im App-Datenordner bleiben erhalten.

## Entwicklung starten

```powershell
cd src
npm install
npm run dev
npm run dev:electron
```

`npm run dev` startet das Vite-Frontend. `npm run dev:electron` baut den Electron-Main-Prozess und startet die Desktop-App.

## Installer bauen

```powershell
cd src
npm run build
npm run dist:win
```

`dist`, `dist-electron`, `release`, `out` und `node_modules` werden nicht committed.

## yt-dlp / ffmpeg / ffprobe

Fuer den Installer-Build muessen diese Dateien lokal vorhanden sein:

- `reference/Windows/yt-dlp.exe`
- `reference/Windows/ffmpeg.exe`
- `reference/Windows/ffprobe.exe`

Sie werden beim Build nur gelesen und als Ressourcen in den Installer aufgenommen. Die Dateien bleiben im Git ignoriert. In der Entwicklungsfassung werden gespeicherte Tool-Pfade, `reference/Windows` und danach der `PATH` geprueft.

## Instagram / Cookies

Instagram kann fuer private oder angemeldete Inhalte Browser-Cookies verlangen. Bei Browser `Automatisch` versucht NellyDownloader unter Windows mehrere Browser nacheinander. Der Beitrag muss im jeweiligen Browser erreichbar sein.

## WhatsApp / Viber

WhatsApp Desktop und der Windows Explorer akzeptieren die Dateiablage normalerweise direkt per Strg+V. Viber kann je nach Version nur Text uebernehmen; in diesem Fall Datei im Explorer anzeigen und per Drag & Drop in Viber ziehen.

## Entwicklungsstand

v0.1.0 ist als Testversion / Release-Kandidat vorbereitet. Die Desktop-App ist funktionsfaehig fuer Analyse, Einzel-Download, Zielordner, Kopieren, Papierkorb, Explorer-Funktionen, Hilfe und konfigurierbare Tastenkombinationen.

Der Installer verwendet die Icons und NSIS-Grafiken aus `assets/installer` sowie das App-Icon aus `assets/icons`.

Die Entwicklungsreferenzen unter `reference/` duerfen nur gelesen und nicht veraendert werden.
