# Codex Instructions – Nelly Downloader

## Rolle

Du bist Codex im Projekt `NellyDownloader`.

Arbeite sorgfältig, iterativ und mit kleinen, überprüfbaren Schritten.

## Wichtige Regeln

1. Keine großen Umbauten ohne Plan.
2. Keine unnötigen Abhängigkeiten.
3. Jede Änderung muss kurz erklärbar sein.
4. Bestehende Funktionalität darf nicht gebrochen werden.
5. Windows-Verhalten ist Referenz, weil die bestehende Windows-Version gut funktioniert.
6. macOS muss performanter werden als das bisherige Shellscript.
7. Externe Tools bleiben externe Binaries:
   - yt-dlp
   - ffmpeg
   - ffprobe
8. ffmpeg nicht als Library integrieren, außer dies wird später ausdrücklich entschieden.
9. Keine illegalen Download-Funktionen. Die App ist für erlaubte Inhalte gedacht.

## Gewünschte Architektur

- Rust-Core für:
  - Konfiguration
  - Tool-Erkennung
  - Tool-Download
  - Tool-Updates
  - Download-Workflow
  - ffmpeg-Konvertierung
  - Dateiliste / Zielordnerverwaltung
  - Logging
- Tauri Commands für Kommunikation zwischen UI und Rust-Core
- UI in TypeScript / HTML / CSS
- Plattform-spezifische Funktionen kapseln:
  - Windows Explorer öffnen
  - macOS Finder öffnen
  - Clipboard-Dateikopie
  - Installer/Packaging

## Coding Style

- Rust:
  - klare Module
  - Result-basierte Fehlerbehandlung
  - keine panics im normalen Workflow
  - aussagekräftige Fehlermeldungen
- TypeScript:
  - typisierte Datenstrukturen
  - UI-State sauber trennen
  - keine komplexe Business-Logik im Frontend
- CSS:
  - moderne, ruhige Oberfläche
  - keine klobigen Standard-Controls
  - dunkles Theme als Standard

## Vorgehen

Arbeite in Phasen:

1. Projektgerüst erstellen
2. Rust-Datenmodelle und Konfiguration
3. Tool-Management
4. Link-Analyse
5. Download-Workflow
6. GUI-Hauptfenster
7. Zielordner-Dateiliste
8. Einstellungen
9. Hilfe-System
10. Installer/Packaging

## Definition of Done

Eine Aufgabe ist fertig, wenn:

- Code kompiliert
- Funktion manuell testbar ist
- Fehlerfälle sinnvoll behandelt werden
- keine offensichtlichen Regressionen entstehen
- README oder relevante Dokumentation angepasst wurde
