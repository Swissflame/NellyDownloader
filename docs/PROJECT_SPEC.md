# Projekt-Spezifikation – Nelly Downloader

## Kurzbeschreibung

Nelly Downloader ist eine moderne Desktop-App zum Herunterladen und optionalen Umwandeln von Videos für erlaubte private oder schulische Zwecke.

Die App ersetzt die bisherige Windows-PowerShell-Version und Mac-Shellscript-Version durch ein professionelles, plattformübergreifendes Projekt.

## Muss-Anforderungen

### Link-Eingabe

Oben im Hauptfenster:

- Textfeld für Link
- Button `Analysieren`
- Button `Download starten`

Der Benutzer kann Links von folgenden Plattformen einfügen:

- Instagram
- YouTube
- Facebook
- TikTok
- Vimeo
- X / Twitter
- weitere Plattformen, sofern yt-dlp sie unterstützt

### Link-Details

In einem separaten Fensterabschnitt werden Details zum aktuellen Link angezeigt:

- Plattform
- Titel
- Kanal / Benutzer, sofern verfügbar
- Video-ID
- Dauer, sofern verfügbar
- Thumbnail, sofern verfügbar
- verfügbare Formate, optional
- erwartete Ausgabe
- Hinweis, ob Login/Cookies wahrscheinlich nötig sind

### Fortschritt

Es gibt mehrere Fortschrittsanzeigen:

- Gesamtfortschritt
- Downloadfortschritt
- Umwandlungsfortschritt

Zusätzlich:

- Statuszeile
- Log-Ausgabe optional aufklappbar
- Fehleranzeige verständlich auf Deutsch

### Download

Der Download verwendet `yt-dlp`.

Standardverhalten:

- Zielordner aus Einstellungen
- H.264/MP4 bevorzugen
- keine Playlist laden, außer später explizit aktiviert
- Dateiname möglichst verständlich:
  - Titel
  - Plattform
  - Video-ID
- optional WhatsApp-kompatible Ausgabe

### Umwandlung

Wenn WhatsApp-kompatible Ausgabe aktiv ist:

- Download zuerst in Projekt-Temp-Ordner
- Umwandlung mit ffmpeg
- Nur fertige WhatsApp-kompatible Datei landet im Zielordner
- Temp-Dateien werden aufgeräumt

WhatsApp-Format:

- Container: MP4
- Video: H.264
- Pixel-Format: yuv420p
- Audio: AAC-LC
- `-movflags +faststart`

### Zielordner-Inhalt

Im Hauptfenster wird der Inhalt des definierten Zielordners angezeigt.

Anzeige:

- Checkbox
- Dateiname
- Größe
- Datum
- Typ
- optional Vorschaubild

Aktionen:

- ausgewählten Inhalt kopieren
- ausgewählten Inhalt löschen
- Zielordner im Explorer/Finder öffnen
- Liste aktualisieren

### Einstellungen

Im TopBar-Menü `Einstellungen`.

Einstellungsfenster:

- Zielordner
- Zielordner-Verzeichnis speichern / auswählen / löschen
- Browser: Chrome, Edge, Firefox, Brave, Safari auf macOS, Opera
- Cookie-Modus: Auto, Browser-Cookies, cookies.txt, Ohne Cookies
- WhatsApp-kompatible Ausgabe ein/aus
- yt-dlp / ffmpeg / ffprobe Pfade und Updates
- Temp-Ordner anzeigen/leeren
- Log anzeigen/löschen

### Hilfe

Im TopBar-Menü `Hilfe`.

Hilfe-Fenster:

- komplettes Benutzerhandbuch
- Stichwortsuche
- Kapitelnavigation

Kapitel:

- Erste Schritte
- Link herunterladen
- Browser-Cookies
- cookies.txt
- WhatsApp-kompatible Dateien
- Zielordner-Verzeichnis
- Dateien kopieren
- Dateien löschen
- Tools aktualisieren
- Fehlerbehebung
- Rechtlicher Hinweis

### Tool-Management

Beim Start prüft die App im App-Datenordner:

- yt-dlp vorhanden?
- ffmpeg vorhanden?
- ffprobe vorhanden?

Wenn nicht vorhanden:

- automatische Installation anbieten oder durchführen
- Fortschritt anzeigen
- Fehler verständlich anzeigen

## Soll-Anforderungen

- modernes dunkles Theme
- gute Performance auf macOS
- kein spürbarer Start-Delay
- Tool-Prüfung nicht bei jedem Start teuer machen
- Tool-Versionen cachen
- Finder/Explorer nicht unnötig blockierend prüfen
- Download-Workflow darf UI nicht blockieren

## Nicht-Ziele für Version 1

- keine eigene Instagram- oder YouTube-Parserlogik
- kein Umgehen technischer Schutzmaßnahmen
- kein integrierter Videoplayer als Pflicht
- keine Cloud-Funktionen
- kein Account-System
