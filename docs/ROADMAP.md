# Roadmap – Nelly Downloader

## Phase 0 – Projektstart

- Repository erstellen
- Dokumente ablegen
- Technische Entscheidung final bestätigen: Tauri + Rust + TypeScript
- Icon und Name festlegen
- Lizenz / rechtlicher Hinweis ergänzen

## Phase 1 – Projektgerüst

- Tauri-Projekt läuft auf Windows
- leeres Hauptfenster
- dunkles Theme
- Grundlayout

## Phase 2 – Core-Konfiguration

- Settings lesen/schreiben
- Standardwerte
- Zielordner-Verzeichnis
- Temp-Ordner

## Phase 3 – Tool-Management

- yt-dlp prüfen
- ffmpeg prüfen
- ffprobe prüfen
- fehlende Tools herunterladen
- Tools aktualisieren

## Phase 4 – Link-Analyse

- Link mit yt-dlp analysieren
- JSON auswerten
- Linkdetails anzeigen

## Phase 5 – Download-Workflow

- Download starten
- Fortschritt aus yt-dlp lesen
- Zielordner aktualisieren

## Phase 6 – WhatsApp-Konvertierung

- Download in Temp
- ffprobe prüfen
- ffmpeg nach H.264/AAC/yuv420p/faststart konvertieren
- finale Datei in Zielordner
- Temp aufräumen

## Phase 7 – Zielordner-Dateiliste

- Dateien im Zielordner anzeigen
- Checkboxen
- Kopieren
- Löschen

## Phase 8 – Einstellungen-Fenster

- alle Einstellungen in GUI editierbar
- Tools-Update
- Zielordner-Verzeichnis

## Phase 9 – Hilfe-System

- Benutzerhandbuch integriert
- Suche
- Kapitel

## Phase 10 – macOS

- Build auf macOS
- Finder öffnen
- macOS Clipboard
- macOS Installer / DMG

## Phase 11 – Installer

Windows:

- MSI oder EXE
- Desktop-Verknüpfung
- Icon

macOS:

- .app
- .dmg
- Icon
- später Signierung/Notarisierung prüfen

## Phase 12 – Polishing

- schöne Animationen
- Fehlertexte verbessern
- Performance messen
- Icons
- Logs
- Export/Import Einstellungen
