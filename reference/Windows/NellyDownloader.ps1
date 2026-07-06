$ErrorActionPreference = "Stop"

try {
    $AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ConfigPath = Join-Path $AppDir "config.ini"
    $LogPath = Join-Path $AppDir "download.log"
    $TargetsPath = Join-Path $AppDir "zielordner.txt"
    $YtDlp = Join-Path $AppDir "yt-dlp.exe"
    $Ffmpeg = Join-Path $AppDir "ffmpeg.exe"
    $CookiesTxt = Join-Path $AppDir "cookies.txt"

    $Config = @{
        Browser = "firefox"
        CookieMode = "browser"
        DownloadDir = "C:\Users\k_dur\Downloads\NellyDownloads"
        WhatsAppCopy = "yes"
    }

    $script:LastDownloadCode = 0
    $ExitProgram = $false

    function Save-Config {
        @(
            "[General]"
            "Browser=$($Config['Browser'])"
            "CookieMode=$($Config['CookieMode'])"
            "DownloadDir=$($Config['DownloadDir'])"
            "WhatsAppCopy=$($Config['WhatsAppCopy'])"
        ) | Set-Content -Path $ConfigPath -Encoding UTF8
    }

    function Load-Config {
        if (Test-Path $ConfigPath) {
            Get-Content $ConfigPath | ForEach-Object {
                if ($_ -match "^\s*([^=]+?)\s*=\s*(.*)\s*$") {
                    $key = $matches[1].Trim()
                    $val = $matches[2].Trim()
                    if ($Config.ContainsKey($key)) {
                        $Config[$key] = $val
                    }
                }
            }
        } else {
            Save-Config
        }
    }

    function Ensure-TargetsFile {
        if (-not (Test-Path $TargetsPath)) {
            @(
                "NellyDownloads|C:\Users\k_dur\Downloads\NellyDownloads"
                "Unterricht|C:\Users\k_dur\Downloads\NellyDownloads\Unterricht"
                "Privat|C:\Users\k_dur\Downloads\NellyDownloads\Privat"
            ) | Set-Content -Path $TargetsPath -Encoding UTF8
        }
    }

    function Get-Targets {
        Ensure-TargetsFile
        $items = @()
        Get-Content $TargetsPath | ForEach-Object {
            if ($_ -match "^\s*([^|]+)\|(.+?)\s*$") {
                $items += [PSCustomObject]@{
                    Name = $matches[1].Trim()
                    Path = $matches[2].Trim()
                }
            }
        }
        return $items
    }

    function Save-Targets {
        param($Items)
        $lines = @()
        foreach ($i in $Items) {
            if ($i.Name -and $i.Path) {
                $lines += "$($i.Name)|$($i.Path)"
            }
        }
        $lines | Set-Content -Path $TargetsPath -Encoding UTF8
    }

    function Pause-Key {
        Write-Host ""
        Write-Host "Druecken Sie eine beliebige Taste . . ." -NoNewline
        [void][System.Console]::ReadKey($true)
        Write-Host ""
    }

    function Write-AppLog {
        param([string]$Text)
        Add-Content -Path $LogPath -Value $Text -Encoding UTF8
    }

    function Get-Platform {
        param([string]$Url)
        $u = $Url.ToLowerInvariant()
        if ($u.Contains("instagram.com")) { return "Instagram" }
        if ($u.Contains("youtube.com") -or $u.Contains("youtu.be")) { return "YouTube" }
        if ($u.Contains("facebook.com") -or $u.Contains("fb.watch")) { return "Facebook" }
        if ($u.Contains("tiktok.com")) { return "TikTok" }
        if ($u.Contains("vimeo.com")) { return "Vimeo" }
        if ($u.Contains("twitter.com") -or $u.Contains("x.com")) { return "X/Twitter" }
        return "Unbekannt"
    }

    function Get-BrowserProcess {
        param([string]$Browser)
        switch ($Browser.ToLowerInvariant()) {
            "chrome" { return "chrome" }
            "edge" { return "msedge" }
            "firefox" { return "firefox" }
            "brave" { return "brave" }
            "opera" { return "opera" }
            default { return $null }
        }
    }

    function Warn-BrowserRunning {
        param([string]$Browser)
        $procName = Get-BrowserProcess $Browser
        if (-not $procName) { return }

        $running = Get-Process -Name $procName -ErrorAction SilentlyContinue
        if ($running) {
            Write-Host ""
            Write-Host "ACHTUNG:" -ForegroundColor Yellow
            Write-Host "$Browser scheint noch zu laufen."
            Write-Host "Das kann verhindern, dass yt-dlp die Cookies lesen kann."
            Write-Host ""
            Write-Host "Bitte $Browser komplett schliessen."
            Write-Host "Danach ENTER druecken, oder einfach ENTER zum Fortfahren."
            Read-Host | Out-Null
        }
    }

    function Explain-Error {
        Write-Host ""
        Write-Host "Moegliche Ursachen:"
        Write-Host "- Instagram/Facebook verlangt eine Anmeldung."
        Write-Host "- Die Browser-Cookie-Datenbank ist gesperrt."
        Write-Host "- Der Browser war noch offen."
        Write-Host "- Der Beitrag ist nicht oeffentlich erreichbar."
        Write-Host "- yt-dlp ist veraltet."
        Write-Host ""
    }

    function Build-YtDlpArgs {
        param(
            [string]$Url,
            [string]$AuthMode,
            [string]$BrowserOverride = ""
        )

        $args = New-Object System.Collections.Generic.List[string]

        if ($AuthMode -eq "cookies_txt") {
            if (Test-Path $CookiesTxt) {
                $args.Add("--cookies")
                $args.Add($CookiesTxt)
            } else {
                Write-Host "WARNUNG: cookies.txt fehlt. Es wird ohne Cookies versucht." -ForegroundColor Yellow
            }
        }
        elseif ($AuthMode -eq "browser") {
            $browserToUse = if ($BrowserOverride) { $BrowserOverride } else { $Config["Browser"] }
            Warn-BrowserRunning $browserToUse
            $args.Add("--cookies-from-browser")
            $args.Add($browserToUse)
        }
        elseif ($AuthMode -eq "auto") {
            Warn-BrowserRunning $Config["Browser"]
            $args.Add("--cookies-from-browser")
            $args.Add($Config["Browser"])
        }

        $args.Add("-P")
        $args.Add($Config["DownloadDir"])

        $args.Add("-S")
        $args.Add("vcodec:h264,res,ext:mp4:m4a")

        $args.Add("-f")
        $args.Add("bv*+ba/b")

        $args.Add("--merge-output-format")
        $args.Add("mp4")
        $args.Add("--no-playlist")

        $args.Add("-o")
        $args.Add("%(title).120B [%(id)s].%(ext)s")

        $args.Add($Url)

        return $args.ToArray()
    }

    function Get-NewestDownloadedMp4 {
        param([datetime]$StartTime)

        $files = Get-ChildItem -Path $Config["DownloadDir"] -Filter "*.mp4" -File -ErrorAction SilentlyContinue |
            Where-Object {
                $_.LastWriteTime -ge $StartTime.AddMinutes(-1) -and
                $_.Name -notlike "* - WhatsApp.mp4"
            } |
            Sort-Object LastWriteTime -Descending

        return $files | Select-Object -First 1
    }

    function Convert-ForWhatsApp {
        param([string]$InputFile)

        if ($Config["WhatsAppCopy"].ToLowerInvariant() -ne "yes") { return }
        if (-not (Test-Path $Ffmpeg)) {
            Write-Host ""
            Write-Host "WhatsApp-Kopie uebersprungen: ffmpeg.exe fehlt." -ForegroundColor Yellow
            return
        }
        if (-not (Test-Path $InputFile)) {
            Write-Host ""
            Write-Host "WhatsApp-Kopie uebersprungen: Eingabedatei fehlt." -ForegroundColor Yellow
            return
        }

        $dir = Split-Path -Parent $InputFile
        $name = [System.IO.Path]::GetFileNameWithoutExtension($InputFile)
        $out = Join-Path $dir ($name + " - WhatsApp.mp4")

        Write-Host ""
        Write-Host "Erstelle WhatsApp-kompatible Datei..."
        Write-Host $out
        Write-Host ""

        & $Ffmpeg -y -i $InputFile `
            -map 0:v:0 -map 0:a? `
            -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p `
            -c:a aac -b:a 128k -ac 2 `
            -movflags +faststart `
            $out

        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "WhatsApp-Datei erstellt." -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "WhatsApp-Konvertierung fehlgeschlagen. Originaldatei bleibt erhalten." -ForegroundColor Yellow
        }
    }

    function Run-YtDlp {
        param(
            [string]$Url,
            [string]$AuthMode,
            [string]$BrowserOverride = ""
        )

        if (-not (Test-Path $YtDlp)) {
            Write-Host ""
            Write-Host "FEHLER: yt-dlp.exe wurde nicht gefunden." -ForegroundColor Red
            Write-Host "Lege yt-dlp.exe in diesen Ordner:"
            Write-Host $AppDir
            Pause-Key
            $script:LastDownloadCode = 9009
            return
        }

        if (-not (Test-Path $Config["DownloadDir"])) {
            New-Item -ItemType Directory -Path $Config["DownloadDir"] -Force | Out-Null
        }

        $platform = Get-Platform $Url
        $startTime = Get-Date

        Write-Host ""
        Write-Host "Plattform erkannt: $platform"
        Write-Host "Download startet..."
        Write-Host ""

        Write-AppLog "========================================="
        Write-AppLog "Download gestartet: $(Get-Date)"
        Write-AppLog "URL: $Url"
        Write-AppLog "DownloadDir: $($Config['DownloadDir'])"
        Write-AppLog "Browser: $($Config['Browser'])"
        Write-AppLog "CookieMode: $AuthMode"
        Write-AppLog "WhatsAppCopy: $($Config['WhatsAppCopy'])"

        $ytArgs = Build-YtDlpArgs -Url $Url -AuthMode $AuthMode -BrowserOverride $BrowserOverride

        & $YtDlp @ytArgs
        $code = $LASTEXITCODE

        Write-AppLog "yt-dlp Ergebniscode: $code"

        if ($code -eq 0) {
            $downloaded = Get-NewestDownloadedMp4 -StartTime $startTime

            Write-Host ""
            Write-Host "Download erfolgreich." -ForegroundColor Green
            Write-AppLog "Download erfolgreich."

            if ($downloaded) {
                Write-AppLog "Datei: $($downloaded.FullName)"
                Convert-ForWhatsApp -InputFile $downloaded.FullName
            } else {
                Write-Host "Hinweis: heruntergeladene MP4-Datei wurde nicht eindeutig gefunden." -ForegroundColor Yellow
            }

            # Wichtig: Auch wenn WhatsApp-Konvertierung scheitert, gilt der Download als erfolgreich.
            $script:LastDownloadCode = 0
        } else {
            $script:LastDownloadCode = $code
            Write-Host ""
            Write-Host "Der Download ist fehlgeschlagen." -ForegroundColor Red
            Explain-Error
        }

        return
    }

    function Fallback-Menu {
        param([string]$Url)

        while ($true) {
            Write-Host "Was moechtest du versuchen?"
            Write-Host ""
            Write-Host "1) Ohne Cookies versuchen"
            Write-Host "2) cookies.txt verwenden"
            Write-Host "3) Chrome verwenden"
            Write-Host "4) Edge verwenden"
            Write-Host "5) Firefox verwenden"
            Write-Host "6) Brave verwenden"
            Write-Host "7) Opera verwenden"
            Write-Host "8) yt-dlp aktualisieren und erneut versuchen"
            Write-Host "0) Abbrechen"
            Write-Host ""
            $choice = Read-Host "Auswahl"

            switch ($choice) {
                "1" { Run-YtDlp -Url $Url -AuthMode "none"; return }
                "2" { Run-YtDlp -Url $Url -AuthMode "cookies_txt"; return }
                "3" { Run-YtDlp -Url $Url -AuthMode "browser" -BrowserOverride "chrome"; return }
                "4" { Run-YtDlp -Url $Url -AuthMode "browser" -BrowserOverride "edge"; return }
                "5" { Run-YtDlp -Url $Url -AuthMode "browser" -BrowserOverride "firefox"; return }
                "6" { Run-YtDlp -Url $Url -AuthMode "browser" -BrowserOverride "brave"; return }
                "7" { Run-YtDlp -Url $Url -AuthMode "browser" -BrowserOverride "opera"; return }
                "8" {
                    Update-YtDlp-Inline | Out-Null
                    Run-YtDlp -Url $Url -AuthMode $Config["CookieMode"]
                    return
                }
                "0" { return }
            }
        }
    }

    function Download-Menu {
        Clear-Host
        Write-Host "========================================="
        Write-Host "            VIDEO HERUNTERLADEN"
        Write-Host "========================================="
        Write-Host ""
        Write-Host "Downloadordner:"
        Write-Host $Config["DownloadDir"]
        Write-Host ""
        Write-Host "Mehrere Links nacheinander moeglich."
        Write-Host "Leere Eingabe = zurueck ins Hauptmenue."
        Write-Host ""

        while ($true) {
            $url = Read-Host "Link einfuegen"
            if ([string]::IsNullOrWhiteSpace($url)) { return }

            Run-YtDlp -Url $url -AuthMode $Config["CookieMode"]

            if ($script:LastDownloadCode -ne 0) {
                Fallback-Menu -Url $url
            }

            Write-Host ""
            Write-Host "Naechster Link oder Enter fuer Hauptmenue."
            Write-Host ""
        }
    }

    function Select-Browser {
        Clear-Host
        Write-Host "========================================="
        Write-Host "             BROWSER AUSWAEHLEN"
        Write-Host "========================================="
        Write-Host ""
        Write-Host "1) Chrome"
        Write-Host "2) Edge"
        Write-Host "3) Firefox"
        Write-Host "4) Brave"
        Write-Host "5) Opera"
        Write-Host ""
        $c = Read-Host "Auswahl"

        switch ($c) {
            "1" { $Config["Browser"] = "chrome" }
            "2" { $Config["Browser"] = "edge" }
            "3" { $Config["Browser"] = "firefox" }
            "4" { $Config["Browser"] = "brave" }
            "5" { $Config["Browser"] = "opera" }
        }

        Save-Config
        Write-Host ""
        Write-Host "Gespeichert: $($Config['Browser'])"
        Pause-Key
    }

    function Select-CookieMode {
        Clear-Host
        Write-Host "========================================="
        Write-Host "              COOKIE-MODUS"
        Write-Host "========================================="
        Write-Host ""
        Write-Host "Aktuell: $($Config['CookieMode'])"
        Write-Host ""
        Write-Host "1) Auto = Browser-Cookies vom gewaehlten Browser"
        Write-Host "2) Nur Browser-Cookies"
        Write-Host "3) Nur cookies.txt"
        Write-Host "4) Ohne Cookies"
        Write-Host ""
        $c = Read-Host "Auswahl"

        switch ($c) {
            "1" { $Config["CookieMode"] = "auto" }
            "2" { $Config["CookieMode"] = "browser" }
            "3" { $Config["CookieMode"] = "cookies_txt" }
            "4" { $Config["CookieMode"] = "none" }
        }

        Save-Config
        Write-Host ""
        Write-Host "Gespeichert: $($Config['CookieMode'])"
        Pause-Key
    }

    function Toggle-WhatsAppCopy {
        if ($Config["WhatsAppCopy"].ToLowerInvariant() -eq "yes") {
            $Config["WhatsAppCopy"] = "no"
        } else {
            $Config["WhatsAppCopy"] = "yes"
        }
        Save-Config
        Write-Host ""
        Write-Host "WhatsApp-Kopie: $($Config['WhatsAppCopy'])"
        Pause-Key
    }

    function Change-DownloadDir {
        Clear-Host
        Write-Host "========================================="
        Write-Host "          DOWNLOADORDNER AENDERN"
        Write-Host "========================================="
        Write-Host ""
        Write-Host "Aktueller Ordner:"
        Write-Host $Config["DownloadDir"]
        Write-Host ""
        Write-Host "Enter ohne Eingabe = aktuellen Ordner behalten."
        Write-Host ""
        $newDir = Read-Host "Neuen Ordner eingeben"

        if (-not [string]::IsNullOrWhiteSpace($newDir)) {
            $Config["DownloadDir"] = $newDir
            if (-not (Test-Path $Config["DownloadDir"])) {
                New-Item -ItemType Directory -Path $Config["DownloadDir"] -Force | Out-Null
            }
            Save-Config
        }

        Write-Host ""
        Write-Host "Gespeichert:"
        Write-Host $Config["DownloadDir"]
        Pause-Key
    }

    function Target-Folder-Menu {
        while ($true) {
            Clear-Host
            Write-Host "========================================="
            Write-Host "          ZIELORDNER-VERZEICHNIS"
            Write-Host "========================================="
            Write-Host ""
            Write-Host "Aktueller Downloadordner:"
            Write-Host $Config["DownloadDir"]
            Write-Host ""
            Write-Host "1) Zielordner aus Verzeichnis auswaehlen"
            Write-Host "2) Aktuellen Zielordner im Verzeichnis speichern"
            Write-Host "3) Neuen Zielordner speichern"
            Write-Host "4) Eintrag loeschen"
            Write-Host "5) Eintraege anzeigen"
            Write-Host "0) Zurueck"
            Write-Host ""

            $c = Read-Host "Auswahl"

            switch ($c) {
                "1" { Select-TargetFolder }
                "2" { Save-CurrentTargetFolder }
                "3" { Add-NewTargetFolder }
                "4" { Delete-TargetFolder }
                "5" { Show-TargetFolders }
                "0" { return }
            }
        }
    }

    function Select-TargetFolder {
        $items = @(Get-Targets)
        Clear-Host
        Write-Host "========================================="
        Write-Host "          ZIELORDNER AUSWAEHLEN"
        Write-Host "========================================="
        Write-Host ""

        if ($items.Count -eq 0) {
            Write-Host "Keine Eintraege vorhanden."
            Pause-Key
            return
        }

        for ($i = 0; $i -lt $items.Count; $i++) {
            Write-Host "$($i+1)) $($items[$i].Name)"
            Write-Host "   $($items[$i].Path)"
        }
        Write-Host ""
        Write-Host "0) Abbrechen"
        Write-Host ""
        $c = Read-Host "Auswahl"

        if ($c -eq "0") { return }

        $index = 0
        if ([int]::TryParse($c, [ref]$index)) {
            $index = $index - 1
            if ($index -ge 0 -and $index -lt $items.Count) {
                $Config["DownloadDir"] = $items[$index].Path
                if (-not (Test-Path $Config["DownloadDir"])) {
                    New-Item -ItemType Directory -Path $Config["DownloadDir"] -Force | Out-Null
                }
                Save-Config
                Write-Host ""
                Write-Host "Ausgewaehlt:"
                Write-Host $Config["DownloadDir"]
            }
        }
        Pause-Key
    }

    function Save-CurrentTargetFolder {
        Clear-Host
        Write-Host "========================================="
        Write-Host "      AKTUELLEN ZIELORDNER SPEICHERN"
        Write-Host "========================================="
        Write-Host ""
        Write-Host "Pfad:"
        Write-Host $Config["DownloadDir"]
        Write-Host ""
        $name = Read-Host "Name fuer diesen Eintrag"

        if ([string]::IsNullOrWhiteSpace($name)) { return }

        $items = @(Get-Targets)
        $items += [PSCustomObject]@{ Name = $name; Path = $Config["DownloadDir"] }
        Save-Targets $items

        Write-Host ""
        Write-Host "Gespeichert."
        Pause-Key
    }

    function Add-NewTargetFolder {
        Clear-Host
        Write-Host "========================================="
        Write-Host "          NEUEN ZIELORDNER SPEICHERN"
        Write-Host "========================================="
        Write-Host ""
        $name = Read-Host "Name"
        if ([string]::IsNullOrWhiteSpace($name)) { return }

        $path = Read-Host "Pfad"
        if ([string]::IsNullOrWhiteSpace($path)) { return }

        if (-not (Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        }

        $items = @(Get-Targets)
        $items += [PSCustomObject]@{ Name = $name; Path = $path }
        Save-Targets $items

        Write-Host ""
        Write-Host "Gespeichert."
        Pause-Key
    }

    function Delete-TargetFolder {
        $items = @(Get-Targets)
        Clear-Host
        Write-Host "========================================="
        Write-Host "             EINTRAG LOESCHEN"
        Write-Host "========================================="
        Write-Host ""

        if ($items.Count -eq 0) {
            Write-Host "Keine Eintraege vorhanden."
            Pause-Key
            return
        }

        for ($i = 0; $i -lt $items.Count; $i++) {
            Write-Host "$($i+1)) $($items[$i].Name)"
            Write-Host "   $($items[$i].Path)"
        }
        Write-Host ""
        Write-Host "0) Abbrechen"
        Write-Host ""
        $c = Read-Host "Welchen Eintrag loeschen"

        if ($c -eq "0") { return }

        $index = 0
        if ([int]::TryParse($c, [ref]$index)) {
            $index = $index - 1
            if ($index -ge 0 -and $index -lt $items.Count) {
                $newItems = @()
                for ($i = 0; $i -lt $items.Count; $i++) {
                    if ($i -ne $index) { $newItems += $items[$i] }
                }
                Save-Targets $newItems
                Write-Host ""
                Write-Host "Eintrag geloescht."
            }
        }
        Pause-Key
    }

    function Show-TargetFolders {
        $items = @(Get-Targets)
        Clear-Host
        Write-Host "========================================="
        Write-Host "             GESPEICHERTE ZIELE"
        Write-Host "========================================="
        Write-Host ""

        if ($items.Count -eq 0) {
            Write-Host "Keine Eintraege vorhanden."
        } else {
            for ($i = 0; $i -lt $items.Count; $i++) {
                Write-Host "$($i+1)) $($items[$i].Name)"
                Write-Host "   $($items[$i].Path)"
            }
        }
        Pause-Key
    }

    function Update-YtDlp-Inline {
        Write-Host "========================================="
        Write-Host "            YT-DLP AKTUALISIEREN"
        Write-Host "========================================="
        Write-Host ""
        if (-not (Test-Path $YtDlp)) {
            Write-Host "FEHLER: yt-dlp.exe wurde nicht gefunden." -ForegroundColor Red
            return 1
        }
        & $YtDlp -U
        return $LASTEXITCODE
    }

    function Update-YtDlp {
        Clear-Host
        Update-YtDlp-Inline | Out-Null
        Pause-Key
    }

    function Update-FFmpeg {
        Clear-Host
        Write-Host "========================================="
        Write-Host "        FFMPEG / FFPROBE AKTUALISIEREN"
        Write-Host "========================================="
        Write-Host ""
        Write-Host "Quelle: gyan.dev - ffmpeg-release-essentials.zip"
        Write-Host ""
        Pause-Key

        $tmpDir = Join-Path $env:TEMP "NellyDownloader_ffmpeg"
        $zipFile = Join-Path $tmpDir "ffmpeg-release-essentials.zip"
        $unzipDir = Join-Path $tmpDir "unzipped"

        if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
        New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

        try {
            Write-Host "Download laeuft..."
            Invoke-WebRequest -Uri "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" -OutFile $zipFile -UseBasicParsing
            Write-Host "Entpacke..."
            Expand-Archive -LiteralPath $zipFile -DestinationPath $unzipDir -Force

            $ffmpeg = Get-ChildItem -Path $unzipDir -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
            $ffprobe = Get-ChildItem -Path $unzipDir -Recurse -Filter "ffprobe.exe" | Select-Object -First 1

            if ($ffmpeg) { Copy-Item $ffmpeg.FullName -Destination (Join-Path $AppDir "ffmpeg.exe") -Force }
            if ($ffprobe) { Copy-Item $ffprobe.FullName -Destination (Join-Path $AppDir "ffprobe.exe") -Force }

            if ($ffmpeg -and $ffprobe) {
                Write-Host ""
                Write-Host "Fertig. ffmpeg.exe und ffprobe.exe wurden aktualisiert." -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "ffmpeg.exe oder ffprobe.exe wurde nicht gefunden." -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host ""
            Write-Host "Update fehlgeschlagen:" -ForegroundColor Red
            Write-Host $_.Exception.Message
            Write-Host ""
            Write-Host "Manuell herunterladen:"
            Write-Host "https://www.gyan.dev/ffmpeg/builds/"
        }

        Pause-Key
    }

    function Clean-Cache {
        Clear-Host
        Write-Host "========================================="
        Write-Host "                 CACHE LOESCHEN"
        Write-Host "========================================="
        Write-Host ""
        if (-not (Test-Path $YtDlp)) {
            Write-Host "FEHLER: yt-dlp.exe wurde nicht gefunden." -ForegroundColor Red
            Pause-Key
            return
        }

        & $YtDlp --rm-cache-dir
        Write-Host ""
        Write-Host "Fertig."
        Pause-Key
    }

    function Show-Info {
        Clear-Host
        Write-Host "========================================="
        Write-Host "                   INFO"
        Write-Host "========================================="
        Write-Host ""
        Write-Host "Nelly Downloader v3.4"
        Write-Host ""
        Write-Host "Fix:"
        Write-Host "- Keine yt-dlp --exec Konvertierung mehr"
        Write-Host "- WhatsApp-Konvertierung laeuft nach erfolgreichem Download"
        Write-Host "- Download bleibt erfolgreich, auch wenn Konvertierung scheitert"
        Write-Host ""
        Pause-Key
    }

    function Show-Log {
        Clear-Host
        Write-Host "========================================="
        Write-Host "                   LOG"
        Write-Host "========================================="
        Write-Host ""
        if (Test-Path $LogPath) {
            Get-Content $LogPath
        } else {
            Write-Host "Noch kein Log vorhanden."
        }
        Write-Host ""
        Pause-Key
    }

    Load-Config
    Ensure-TargetsFile

    while (-not $ExitProgram) {
        Clear-Host
        Write-Host "========================================="
        Write-Host "           NELLY DOWNLOADER v3.4"
        Write-Host "========================================="
        Write-Host ""
        Write-Host "Browser:          $($Config['Browser'])"
        Write-Host "Cookie-Modus:     $($Config['CookieMode'])"
        Write-Host "WhatsApp-Kopie:   $($Config['WhatsAppCopy'])"
        Write-Host "Downloadordner:"
        Write-Host $Config["DownloadDir"]
        Write-Host ""
        Write-Host "1) Video herunterladen"
        Write-Host "2) Browser auswaehlen"
        Write-Host "3) Cookie-Modus auswaehlen"
        Write-Host "4) Downloadordner direkt aendern"
        Write-Host "5) Zielordner-Verzeichnis"
        Write-Host "6) WhatsApp-Kopie ein/aus"
        Write-Host "7) yt-dlp aktualisieren"
        Write-Host "8) ffmpeg / ffprobe aktualisieren"
        Write-Host "9) Cache loeschen"
        Write-Host "l) Log anzeigen"
        Write-Host "i) Info"
        Write-Host "0) Beenden"
        Write-Host ""

        $choice = Read-Host "Auswahl"

        switch ($choice) {
            "1" { Download-Menu }
            "2" { Select-Browser }
            "3" { Select-CookieMode }
            "4" { Change-DownloadDir }
            "5" { Target-Folder-Menu }
            "6" { Toggle-WhatsAppCopy }
            "7" { Update-YtDlp }
            "8" { Update-FFmpeg }
            "9" { Clean-Cache }
            "l" { Show-Log }
            "L" { Show-Log }
            "i" { Show-Info }
            "I" { Show-Info }
            "0" { $ExitProgram = $true }
        }
    }
}
catch {
    Write-Host ""
    Write-Host "========================================="
    Write-Host "FEHLER IN NELLY DOWNLOADER" -ForegroundColor Red
    Write-Host "========================================="
    Write-Host ""
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Details:"
    Write-Host $_.ScriptStackTrace
    Write-Host ""
    Write-Host "Bitte Screenshot dieser Meldung schicken."
    Write-Host ""
    Write-Host "Druecken Sie eine beliebige Taste . . ." -NoNewline
    [void][System.Console]::ReadKey($true)
}
