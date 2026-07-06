# Codex Prompt-Sammlung

## Prompt 1 – Projekt analysieren

```text
Lies alle Markdown-Dokumente im Projektordner. Erstelle danach eine kurze Zusammenfassung:
- Ziel des Projekts
- geplante Architektur
- erste sinnvolle Implementierungsschritte
Ändere noch keinen Code.
```

## Prompt 2 – Tauri Projektgerüst

```text
Erstelle ein neues Tauri-Projekt für Nelly Downloader mit Rust und TypeScript.
Ziel:
- App startet auf Windows
- dunkles Hauptfenster
- TopBar mit "Einstellungen" und "Hilfe"
- Link-Eingabefeld oben
- Download-Button ohne Funktion
Bitte halte die Struktur kompatibel mit den Dokumenten im Projekt.
```

## Prompt 3 – Konfigurationsmodul

```text
Implementiere das Rust-Konfigurationsmodul.
Anforderungen:
- Settings-Struktur gemäß DATA_MODELS.md
- Laden aus AppData/Application Support
- Speichern als JSON
- sinnvolle Defaults
- Tauri Commands get_settings und save_settings
- Fehlerbehandlung auf Deutsch
```

## Prompt 4 – Tool Management

```text
Implementiere Tool-Management für yt-dlp, ffmpeg und ffprobe.
Anforderungen:
- Prüfen, ob Tools vorhanden sind
- Version auslesen
- ToolStatus zurückgeben
- fehlende Tools herunterladen
- Update-Funktion vorbereiten
- keine UI blockieren
```

## Prompt 5 – Link Analyse

```text
Implementiere Link-Analyse über yt-dlp.
Anforderungen:
- yt-dlp mit JSON-Ausgabe aufrufen
- Plattform, Titel, Uploader, ID, Dauer und Thumbnail auslesen
- LinkInfo an Frontend zurückgeben
- Fehler verständlich auf Deutsch ausgeben
```

## Prompt 6 – Download Workflow

```text
Implementiere den Download-Workflow.
Anforderungen:
- Download über yt-dlp starten
- Fortschritt aus stdout/stderr parsen
- Tauri Event an UI senden
- DownloadJob Status aktualisieren
- Zielordner nach Abschluss aktualisieren
```

## Prompt 7 – WhatsApp-Konvertierung

```text
Implementiere WhatsApp-kompatible Ausgabe.
Anforderungen:
- Wenn aktiviert: Download in Temp
- ffprobe zur Analyse
- ffmpeg Konvertierung nach H.264/AAC/yuv420p/faststart
- finale Datei in Zielordner
- Temp aufräumen
- Konvertierungsfortschritt an UI senden
```
