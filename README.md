# NellyDownloader

![NellyDownloader Vorschau](assets/readme/github-preview.png)

NellyDownloader ist eine lokale Electron-App zum Analysieren, Herunterladen und Vorbereiten einzelner Medienlinks. Die App nutzt eine Vite/TypeScript-Oberflaeche und fuehrt lokale Aufgaben wie yt-dlp, ffprobe, ffmpeg und Dateiaktionen im Electron Main-Prozess aus.

## Hauptfunktionen

- Link-Analyse fuer einzelne http- und https-URLs
- Einzel-Download mit yt-dlp, ohne Playlists
- Zielordner-Auswahl und echte Zielordner-Dateiliste
- Downloadmodus: automatisch, erst analysieren, direkt herunterladen
- WhatsApp-Kompatibilitaet mit ffprobe/ffmpeg-Pruefung
- optionales Verschieben der Originaldatei in den Papierkorb nach erfolgreicher Umwandlung
- Kopieren ausgewaehlter Dateien in die System-Zwischenablage
- sicheres Verschieben ausgewaehlter Dateien in den Papierkorb
- durchsuchbares Benutzerhandbuch und Info-Dialog

## Sicherheit

- Der Renderer hat keinen direkten Node-Zugriff.
- Dateisystem und externe Prozesse laufen ueber Preload, IPC und den Electron Main-Prozess.
- Playlists werden nicht heruntergeladen.
- Bestehende Dateien werden nicht ueberschrieben.
- Dateiaktionen akzeptieren nur Dateien aus dem eingestellten Zielordner.
- Loeschen bedeutet immer Papierkorb, nicht permanente Loeschung.

## Entwicklungsstand

Die Desktop-App ist funktionsfaehig fuer Analyse, Einzel-Download, Zielordner, Kopieren, Papierkorb und Hilfe. Grafiken und Anwendungssymbol sind eingebunden. Ein Installer ist noch nicht fertig; die vorbereiteten Installer-Assets liegen bereits unter `assets/installer`.

## Entwicklung

```powershell
cd src
npm install
npm run dev
npm run dev:electron
npm run build
```

Die Entwicklungsreferenzen unter `reference/` duerfen nur gelesen und nicht veraendert werden.
