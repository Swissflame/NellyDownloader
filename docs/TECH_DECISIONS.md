# Technische Entscheidungen

## Entscheidung 1: Tauri statt klassischer C# GUI

Begründung:

- moderne Oberfläche
- keine klobige Standard-Windows-Optik
- Windows und macOS
- kleine Installer
- Rust-Backend möglich
- Web-UI flexibel gestaltbar

## Entscheidung 2: Rust für Core

Begründung:

- sehr schnell
- kleine native Binaries
- gute Prozesssteuerung
- gute plattformübergreifende Möglichkeiten
- geeignet für Downloader-Workflows

## Entscheidung 3: ffmpeg bleibt extern

Begründung:

- ffmpeg ist bereits hochoptimiert
- Integration als Library wäre aufwendig
- Lizenz- und Build-Komplexität
- externe Binary kann einfach aktualisiert werden
- Performancegewinn durch Integration wäre voraussichtlich gering

## Entscheidung 4: yt-dlp bleibt extern

Begründung:

- Plattformen ändern sich häufig
- yt-dlp wird laufend gepflegt
- eigene Implementierung wäre unverhältnismäßig

## Entscheidung 5: WhatsApp-Ausgabe über Temp

Begründung:

- Zielordner bleibt sauber
- Benutzer sieht nur die fertige Datei
- Original-Zwischendateien können entfernt werden

## Entscheidung 6: Windows-Version als funktionale Referenz

Begründung:

- bestehende Windows-Version funktioniert gut
- Workflow ist bestätigt
- Mac-Version muss technisch aufholen
