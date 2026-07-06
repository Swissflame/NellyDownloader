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

Aktueller Stand: `yt-dlp.exe`, `ffmpeg.exe` und `ffprobe.exe` werden noch nicht in den Installer aufgenommen. Fuer Entwicklung und Tests greift die App weiterhin auf gespeicherte Tool-Pfade, `reference/Windows` oder den `PATH` zurueck.
