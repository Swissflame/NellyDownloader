# Nelly Downloader – Professional Edition

## Ziel

Nelly Downloader wird eine moderne, plattformübergreifende Desktop-App für Windows und macOS.

Die App lädt Videos von unterstützten Plattformen über `yt-dlp`, verarbeitet sie optional mit `ffmpeg` in ein WhatsApp-kompatibles Format und bietet eine einfache moderne GUI.

## Zielplattformen

- Windows 10 / 11
- macOS Apple Silicon und Intel, soweit mit Tooling sinnvoll möglich

## Aktuelle Technik

- Frontend/App Shell: Electron mit Vite/TypeScript
- Lokaler Core: Electron Main-Prozess
- UI: HTML / CSS / TypeScript
- Externe Tools:
  - yt-dlp
  - ffmpeg
  - ffprobe

Aktuell aktiv:

- Link-Analyse mit `yt-dlp`
- sicherer Einzel-Download mit `yt-dlp`
- Downloadmodus: automatisch, erst analysieren oder direkt herunterladen
- Playlists sind deaktiviert
- bestehende Dateien werden nicht ueberschrieben
- Instagram kann Browser-Cookies verwenden
- WhatsApp-Kompatibilitaet: Auto, immer umwandeln oder nie umwandeln
- Originaldatei nach Umwandlung: behalten oder nach erfolgreicher Umwandlung in den Papierkorb verschieben
- ffprobe/ffmpeg werden fuer Kompatibilitaetspruefung und optionale Umwandlung genutzt
- ausgewaehlte Dateien koennen in die System-Zwischenablage kopiert werden
- Dateien werden beim Kopieren nicht veraendert

Noch nicht aktiv:

- Loeschen ausgewaehlter Dateien

## Hauptfunktionen

- Link einfügen
- Link analysieren
- Details zum Link anzeigen
- Download starten
- Fortschritt anzeigen
  - Gesamtfortschritt
  - Downloadfortschritt
  - Umwandlungsfortschritt
- Zielordnerinhalt anzeigen
- Dateien per Checkbox auswählen
- ausgewählte Dateien kopieren
- ausgewählte Dateien löschen
- Einstellungen verwalten
- Hilfe / Benutzerhandbuch mit Suche anzeigen
- Tools aktualisieren:
  - yt-dlp
  - ffmpeg
  - ffprobe

## Wichtig

Bitte nur Inhalte herunterladen, für die der Benutzer die Rechte oder Erlaubnis hat.
