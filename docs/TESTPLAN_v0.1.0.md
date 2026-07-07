# Testplan v0.1.0

Status: Release-Kandidat / Testversion.

## Vorbereitung

- `npm install` im Ordner `src` ausfuehren.
- `reference/Windows/yt-dlp.exe` ist lokal vorhanden.
- `reference/Windows/ffmpeg.exe` ist lokal vorhanden.
- `reference/Windows/ffprobe.exe` ist lokal vorhanden.
- Einen leeren Zielordner und einen Zielordner mit vorhandenen Mediendateien bereithalten.

## Build und Installation

- `npm run build` ausfuehren.
- `npm run dev` starten und Frontend im Browser pruefen.
- `npm run dev:electron` starten und Electron-App pruefen.
- `npm run dist:win` ausfuehren.
- Pruefen, dass `src/release/NellyDownloader-Setup-0.1.0.exe` erzeugt wurde.
- Installer starten.
- Installationspfad waehlen.
- Startmenue- und Desktop-Verknuepfung pruefen.
- Installierte App starten.

## Grundfunktionen

- Start der App testen.
- Zielordner in den Einstellungen auswaehlen.
- Zielordner nach App-Neustart pruefen.
- Zielordner mit vielen Dateien anzeigen.
- Leeren Zielordner anzeigen.

## Downloads

- YouTube Download mit kleinem Testvideo pruefen.
- TikTok Download pruefen.
- Instagram Download mit Browser-Cookies pruefen.
- Pruefen, dass Playlists nicht heruntergeladen werden.
- Pruefen, dass bestehende Dateien nicht ueberschrieben werden.
- Pruefen, dass nach Download der Zielordner aktualisiert wird.

## WhatsApp-Kompatibilitaet

- Modus `Auto` testen.
- Pruefen, dass kompatible Dateien nicht unnoetig umgewandelt werden.
- Modus `Immer umwandeln` testen.
- Modus `Nie umwandeln` testen.
- Einstellung `Originaldatei behalten` testen.
- Einstellung `Originaldatei in Papierkorb verschieben` testen.
- Pruefen, dass Originaldateien nur nach erfolgreicher Umwandlung und aktiver Option verschoben werden.

## Dateiaktionen

- Eine Datei kopieren.
- Mehrere Dateien kopieren.
- In WhatsApp Desktop einfuegen.
- In Windows Explorer einfuegen.
- Viber-Workaround pruefen: Datei im Explorer anzeigen und per Drag & Drop einfuegen.
- Keine Datei auswaehlen und Kopieren pruefen.
- Eine Datei in den Papierkorb verschieben.
- Mehrere Dateien in den Papierkorb verschieben.
- Abbrechen im Sicherheitsdialog pruefen.
- Pruefen, dass Dateien nicht permanent geloescht werden.
- Pruefen, dass Dateien ausserhalb des Zielordners nicht akzeptiert werden.

## Explorer-Funktionen

- Zielordner oeffnen.
- Nicht vorhandenen Zielordner testen.
- Keine Datei auswaehlen und `Im Explorer anzeigen` pruefen.
- Eine Datei auswaehlen und im Explorer anzeigen.
- Mehrere Dateien auswaehlen und Hinweis pruefen.

## Hilfe und Info

- Hilfe-Fenster mit Button oeffnen.
- Hilfe-Fenster mit F1 oeffnen.
- Hilfe erneut oeffnen und pruefen, dass bestehendes Fenster fokussiert wird.
- Suchbegriffe testen: Instagram, WhatsApp, Papierkorb, Zielordner, Downloadmodus.
- Hilfe-Fenster schliessen.
- Info-Fenster oeffnen.
- Pruefen, dass Version `0.1.0` angezeigt wird.

## Tastenkombinationen

- Tastenkombinationen-Fenster aus Einstellungen oeffnen.
- Shortcut aendern.
- Konflikt mit bestehendem Shortcut testen.
- Ungueltige Kombination testen.
- Shortcut zuruecksetzen.
- Alle Shortcuts zuruecksetzen.
- App neu starten und gespeicherte Shortcuts pruefen.
- Ctrl+L fokussiert Linkfeld.
- Ctrl+Shift+L leert Linkfeld.
- Ctrl+A im Linkfeld markiert Text.
- Ctrl+A ausserhalb Textfeld waehlt alle Dateien.
- Ctrl+Shift+A waehlt alle Dateien ab.
- Ctrl+Alt+A invertiert Auswahl.
- Ctrl+Shift+N waehlt neueste Datei.
- Home / End in fokussierter Dateiliste pruefen.
- ArrowUp / ArrowDown in fokussierter Dateiliste pruefen.
- Delete oeffnet weiterhin Sicherheitsdialog.
- Ctrl+O oeffnet Zielordner.
- Ctrl+Shift+O zeigt ausgewaehlte Datei im Explorer.

## Deinstallation und Neuinstallation

- App schliessen.
- Deinstallation starten.
- Pruefen, dass Programmdateien entfernt werden.
- Pruefen, dass lokale Benutzereinstellungen nicht ungefragt geloescht werden.
- Neuinstallation ausfuehren.
- App erneut starten.
- Zielordner, Hilfe, Shortcut-Bearbeitung, Download, Kopieren und Papierkorb kurz erneut pruefen.
