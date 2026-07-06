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

Fuer den Installer-Build muessen diese Dateien lokal vorhanden sein:

- `reference/Windows/yt-dlp.exe`
- `reference/Windows/ffmpeg.exe`
- `reference/Windows/ffprobe.exe`

Sie werden beim Build als Ressourcen in den Installer aufgenommen und liegen in der installierten App unter `resources/tools/win/`. Die Dateien bleiben im Git ignoriert und werden nicht als normale Repository-Dateien committed.

Im Dev-Modus greift die App weiterhin auf gespeicherte Tool-Pfade, `reference/Windows` oder den `PATH` zurueck.
