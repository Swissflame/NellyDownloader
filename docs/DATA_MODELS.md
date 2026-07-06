# Datenmodelle – Nelly Downloader

## Settings

```json
{
  "browser": "firefox",
  "cookieMode": "browser",
  "downloadDir": "C:/Users/k_dur/Downloads/NellyDownloads",
  "whatsAppCompatible": true,
  "openTargetFolderOnDownload": true,
  "theme": "dark",
  "language": "de",
  "toolCheckOnStartup": true,
  "debugLogging": false
}
```

## Browser

```text
chrome
edge
firefox
brave
safari
opera
```

Safari nur auf macOS anzeigen.

## CookieMode

```text
auto
browser
cookies_txt
none
```

## ToolStatus

```json
{
  "name": "yt-dlp",
  "path": "...",
  "installed": true,
  "version": "2026.x.x",
  "updateAvailable": false,
  "lastChecked": "2026-06-28T12:00:00"
}
```

## LinkInfo

```json
{
  "url": "https://...",
  "platform": "Instagram",
  "title": "Video by ...",
  "uploader": "srfstudio404",
  "id": "DaDqK5dIRhl",
  "durationSeconds": 42,
  "thumbnailUrl": "https://...",
  "requiresCookies": false,
  "estimatedFilename": "Video by ... [DaDqK5dIRhl].mp4"
}
```

## DownloadJob

```json
{
  "id": "uuid",
  "url": "https://...",
  "status": "downloading",
  "overallProgress": 0.42,
  "downloadProgress": 0.85,
  "convertProgress": 0.00,
  "message": "Lade Video herunter...",
  "outputFile": null,
  "error": null
}
```

## TargetFolder

```json
{
  "name": "Unterricht",
  "path": "C:/Users/k_dur/Downloads/NellyDownloads/Unterricht"
}
```

## FolderItem

```json
{
  "path": "...",
  "name": "Video.mp4",
  "sizeBytes": 12345678,
  "modified": "2026-06-28T12:00:00",
  "extension": "mp4",
  "selected": false
}
```
