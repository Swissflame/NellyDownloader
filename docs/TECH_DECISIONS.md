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

## Entscheidung 8: Kopieren ueber System-Zwischenablage

Begruendung:

- der Renderer sendet nur Dateinamen, keine freien Pfade
- der Main-Prozess validiert Zielordner, Existenz und Dateityp
- Dateien werden nicht veraendert, verschoben oder geloescht
- Windows versucht echte Datei-Zwischenablage ueber `Set-Clipboard -LiteralPath`
- Fallback ist Text mit vollstaendigen Dateipfaden
- macOS/Linux verwenden vorerst den Textpfad-Fallback

## Entscheidung 9: WhatsApp-Ausgabe ueber Temp

Begruendung:

- Zielordner bleibt sauber
- Benutzer sieht nur die fertige Datei
- Original-Zwischendateien koennen entfernt werden

## Entscheidung 10: Windows-Version als funktionale Referenz

Begruendung:

- bestehende Windows-Version funktioniert gut
- Workflow ist bestaetigt
- Mac-Version muss technisch aufholen
