# Build und Installer

## Entwicklung starten

```powershell
cd src
npm install
npm run dev
```

`npm run dev` startet nur das Vite-Frontend.

## Electron-App starten

```powershell
cd src
npm run dev:electron
```

Der Befehl baut den Electron-Main-Prozess und startet die lokale Desktop-App.

## Produktionsbuild

```powershell
cd src
npm run build
```

Der Renderer landet in `src/dist/`, der Electron-Code in `src/dist-electron/`. Beide Ordner werden nicht committed.

## Unpacked Package

```powershell
cd src
npm run package
```

Dieser Befehl erzeugt eine unpacked Windows-App im Ausgabeordner `src/release/`.

## Windows-Installer

```powershell
cd src
npm run dist:win
```

Der NSIS-Installer wird unter `src/release/` erzeugt. Der Ordner ist in `.gitignore` eingetragen und wird nicht committed.

Der Installer heisst nach erfolgreichem Build z.B. `NellyDownloader-Setup-0.1.0.exe`.

Nicht committen:

- `src/node_modules/`
- `src/dist/`
- `src/dist-electron/`
- `src/release/`
- `out/`
- erzeugte Installer-EXE- und Blockmap-Dateien

Verwendete Installer-Assets:

- App-Icon: `assets/icons/app-icon.ico`
- Installer-/Uninstaller-Icon: `assets/installer/installer-icon.ico`
- NSIS-Header: `assets/installer/installer-header.bmp`
- NSIS-Sidebar: `assets/installer/installer-sidebar.bmp`

Die BMP-Dateien sind abgeleitete Installer-Versionen der PNG-Grafiken unter `assets/installer`.

Fuer den Installer-Build muessen diese Dateien lokal vorhanden sein:

- `reference/Windows/yt-dlp.exe`
- `reference/Windows/ffmpeg.exe`
- `reference/Windows/ffprobe.exe`

Sie werden beim Build als Ressourcen in den Installer aufgenommen und liegen in der installierten App unter `resources/tools/win/`. Die Dateien bleiben im Git ignoriert und werden nicht als normale Repository-Dateien committed.

Im Dev-Modus greift die App weiterhin auf gespeicherte Tool-Pfade, `reference/Windows` oder den `PATH` zurueck.

Der Installer laeuft als assistierter NSIS-Installer: Benutzer koennen den Installationspfad waehlen, NellyDownloader wird als Startmenue- und Desktop-Verknuepfung angelegt, und die App kann am Ende der Installation direkt gestartet werden. Beim Deinstallieren werden Programmdateien entfernt; lokale Benutzereinstellungen im App-Datenordner werden nicht automatisch geloescht.

## Release-Kandidat 0.1.0 pruefen

Vor einem Release-Kandidaten sollten diese Befehle erfolgreich laufen:

```powershell
cd src
npm run build
npm run dev
npm run dev:electron
npm run dist:win
```

`npm run dev` laeuft dauerhaft als Devserver und kann nach erfolgreichem Browser-Test beendet werden.

Nach `npm run dist:win` liegt der Installer unter `src/release/NellyDownloader-Setup-0.1.0.exe`.
