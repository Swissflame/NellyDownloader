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

## Entscheidung 3: Einstellungen im Electron-userData-Ordner

Begruendung:

- Einstellungen gehoeren nicht in den Projektordner
- Electron stellt mit `app.getPath("userData")` einen plattformgerechten App-Datenordner bereit
- `settings.json` ist fuer die aktuelle Projektphase einfach lesbar und gut testbar
- beim ersten Start koennen Standardwerte verwendet werden

## Entscheidung 4: Zielordnerzugriff nur im Main-Prozess

Begruendung:

- der Renderer bleibt vom Dateisystem getrennt
- Dateizugriff laeuft kontrolliert ueber IPC und Preload
- Unterordner werden nicht angezeigt
- nur unterstuetzte Mediendateien werden gelistet
- Loeschen und Kopieren bleiben absichtlich deaktiviert, bis diese Aktionen gesondert abgesichert sind

## Entscheidung 5: ffmpeg bleibt extern

Begruendung:

- ffmpeg ist bereits hochoptimiert
- Integration als Library waere aufwendig
- Lizenz- und Build-Komplexitaet bleibt geringer
- externe Binary kann einfach aktualisiert werden
- Performancegewinn durch Integration waere voraussichtlich gering

## Entscheidung 6: yt-dlp bleibt extern

Begruendung:

- Plattformen aendern sich haeufig
- yt-dlp wird laufend gepflegt
- eigene Implementierung waere unverhaeltnismaessig
- Electron Main kann spaeter den Prozessstart kapseln

Aktueller Stand:

- `yt-dlp` wird bereits fuer Link-Metadaten genutzt
- Aufruf nur mit `--dump-json --no-playlist --skip-download`
- Suche ueber gespeicherten Pfad, Windows-Referenzdatei und `PATH`
- Instagram nutzt bei Bedarf die Cookie-Strategie der alten Referenzversion
- Browser-Cookies werden mit `--cookies-from-browser` und sauberer Argumentliste versucht
- Tracking-Parameter werden fuer Instagram-Reel/Post-Links vor der Analyse entfernt

## Entscheidung 7: Sicherer Einzel-Download

Begruendung:

- der Download bleibt im Electron Main-Prozess
- der Renderer hat weiterhin keinen direkten Node- oder Dateisystemzugriff
- `yt-dlp` wird mit `spawn` und Argumentliste gestartet
- Playlists sind deaktiviert
- bestehende Dateien werden nicht ueberschrieben
- der Dateiname enthaelt Titel, ID und Zeitstempel
- Instagram nutzt dieselbe Cookie-Strategie wie die Analyse
- Fortschritt wird nur als strukturiertes Event an den Renderer geschickt
- Downloadmodi verhindern unnoetige doppelte yt-dlp-Analyse
- Analyse und Download laufen sequenziell, nicht parallel fuer denselben Link

## Entscheidung 8: WhatsApp-Kompatibilitaet nach Download

Begruendung:

- `ffprobe` prueft Container und Codecs nach dem Download
- kompatible Dateien muessen im Auto-Modus nicht umgewandelt werden
- bei Bedarf erzeugt `ffmpeg` eine neue MP4/H.264/AAC-Datei
- Originaldateien bleiben standardmaessig erhalten
- optional wird nur die Originaldatei des aktuellen Download-/Umwandlungslaufs per `shell.trashItem` in den Papierkorb verschoben
- vor dem Verschieben wird die neue MP4 auf Existenz, Groesse und ffprobe-Lesbarkeit geprueft
- Toolsuche laeuft ueber Einstellungen, Windows-Referenzdateien und `PATH`
- Fortschritt der Umwandlung wird als strukturiertes Event an den Renderer geschickt

## Entscheidung 9: Kopieren ueber System-Zwischenablage

Begruendung:

- der Renderer sendet nur Dateinamen, keine freien Pfade
- der Main-Prozess validiert Zielordner, Existenz und Dateityp
- Dateien werden nicht veraendert, verschoben oder geloescht
- Windows versucht echte CF_HDROP/FileDropList-Zwischenablage ueber PowerShell/.NET im STA-Modus
- Dateipfade werden als Base64-JSON ueber eine Umgebungsvariable uebergeben
- bei erfolgreicher Dateiablage wird kein Text-Fallback gesetzt
- Fallback ist Text mit vollstaendigen Dateipfaden
- macOS/Linux verwenden vorerst den Textpfad-Fallback

## Entscheidung 10: WhatsApp-Ausgabe ueber Temp

Begruendung:

- Zielordner bleibt sauber
- Benutzer sieht nur die fertige Datei
- Original-Zwischendateien koennen entfernt werden

## Entscheidung 11: Papierkorb statt permanenter Loeschung

Begruendung:

- ausgewaehlte Dateien werden nur nach Sicherheitsabfrage verschoben
- der Renderer sendet nur Dateinamen, keine freien Pfade
- der Main-Prozess validiert Zielordner, Existenz und Dateityp
- `shell.trashItem` verschiebt in den Papierkorb statt permanent zu loeschen
- Teilfehler werden gemeldet, betroffene Dateien bleiben erhalten

## Entscheidung 12: Windows-Version als funktionale Referenz

Begruendung:

- bestehende Windows-Version funktioniert gut
- Workflow ist bestaetigt
- Mac-Version muss technisch aufholen

## Entscheidung 13: Zentrale Assets ausserhalb von src

Begruendung:

- Icons, UI-Grafiken, About-Grafiken, README-Vorschau und spaetere Installer-Grafiken bleiben an einem Ort unter `assets/`
- der Renderer verwendet `src/config/assets.ts`, damit Vite robuste URLs fuer Dev-Server und packaged `file://`-App erzeugt
- der Electron Main-Prozess nutzt eine Asset-Pfad-Hilfe mit `process.resourcesPath` fuer packaged Builds
- Installer-Assets sind vorbereitet; App- und Installer-Icons sind im Build eingebunden

## Entscheidung 14: Shortcuts im Renderer statt neue Logik

Begruendung:

- Tastenkombinationen sollen exakt bestehende Button- und Rechtsklick-Aktionen ausloesen
- Download-, yt-dlp-, ffmpeg- und Dateioperationslogik bleiben unveraendert
- Texteingaben werden geschuetzt, damit Ctrl+A und Delete in Feldern nicht zweckentfremdet werden
- die Belegung wird in `AppSettings` vorbereitet und in den Einstellungen angezeigt
- externe Bediengeraete koennen auf die Shortcuts gelegt werden, ohne eigene Integrationslogik

## Entscheidung 15: Separate Scrollflaeche fuer die Dateiliste

Begruendung:

- bei vielen Zielordner-Dateien bleibt das App-Fenster stabiler
- Link-, Analyse- und Fortschrittsbereiche bleiben leichter sichtbar
- Kopieren- und Papierkorb-Buttons bleiben unter der Liste erreichbar
- die Aenderung betrifft nur Layout/CSS und keine Dateioperationen

## Entscheidung 16: electron-builder fuer Windows-Installer

Begruendung:

- electron-builder integriert Vite-Renderer und Electron-Main ohne eigene Installer-Pipeline
- NSIS erzeugt einen normalen Windows-Installer mit Startmenue- und Desktop-Verknuepfung
- App-Icon, Installer-Icon, Header und Sidebar werden aus den vorhandenen Assets verwendet
- Build-Artefakte landen in `src/release/` und werden nicht committed
- Windows-Tools werden aus `reference/Windows` als `extraResources` unter `resources/tools/win/` mitgeliefert
- im Dev-Modus bleibt die Suche ueber gespeicherte Pfade, `reference/Windows` und `PATH` erhalten
- der NSIS-Uninstaller entfernt Programmdateien, loescht aber lokale Benutzereinstellungen nicht automatisch
