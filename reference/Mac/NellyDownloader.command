#!/bin/bash
# Nelly Downloader Mac v1.1

set -u

APPDIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$APPDIR/config.conf"
TARGETS="$APPDIR/zielordner.txt"
LOG="$APPDIR/download.log"
TEMPDIR="$APPDIR/temp"

YTDLP="$APPDIR/yt-dlp"
FFMPEG="$APPDIR/ffmpeg"
FFPROBE="$APPDIR/ffprobe"
COOKIES_TXT="$APPDIR/cookies.txt"

DEFAULT_BROWSER="firefox"
DEFAULT_COOKIE_MODE="browser"
DEFAULT_DOWNLOAD_DIR="$HOME/Downloads/NellyDownloads"
DEFAULT_WHATSAPP_COPY="yes"

BROWSER="$DEFAULT_BROWSER"
COOKIE_MODE="$DEFAULT_COOKIE_MODE"
DOWNLOAD_DIR="$DEFAULT_DOWNLOAD_DIR"
WHATSAPP_COPY="$DEFAULT_WHATSAPP_COPY"

pause_key(){ echo; read -n 1 -s -r -p "Drücke eine beliebige Taste . . ."; echo; }
screen_header(){ clear; echo "========================================="; echo "        NELLY DOWNLOADER MAC v1.1"; echo "========================================="; echo; }
save_config(){ cat > "$CONFIG" <<EOF
Browser=$BROWSER
CookieMode=$COOKIE_MODE
DownloadDir=$DOWNLOAD_DIR
WhatsAppCopy=$WHATSAPP_COPY
EOF
}
load_config(){ if [[ -f "$CONFIG" ]]; then while IFS='=' read -r key value; do case "$key" in Browser) BROWSER="$value";; CookieMode) COOKIE_MODE="$value";; DownloadDir) DOWNLOAD_DIR="${value/#\~/$HOME}";; WhatsAppCopy) WHATSAPP_COPY="$value";; esac; done < "$CONFIG"; else save_config; fi; }
ensure_project_dirs(){ mkdir -p "$TEMPDIR" "$DOWNLOAD_DIR"; }
ensure_targets(){ if [[ ! -f "$TARGETS" ]]; then cat > "$TARGETS" <<EOF
NellyDownloads|$HOME/Downloads/NellyDownloads
Unterricht|$HOME/Downloads/NellyDownloads/Unterricht
Privat|$HOME/Downloads/NellyDownloads/Privat
EOF
fi; }
log_line(){ echo "$1" >> "$LOG"; }
remove_quarantine(){ command -v xattr >/dev/null 2>&1 && xattr -d com.apple.quarantine "$1" >/dev/null 2>&1 || true; }
download_yt_dlp(){ screen_header; echo "yt-dlp fehlt. Lade yt-dlp für macOS herunter..."; echo; curl -L --fail "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos" -o "$YTDLP"; if [[ $? -ne 0 ]]; then echo "FEHLER: yt-dlp konnte nicht heruntergeladen werden."; pause_key; return 1; fi; chmod +x "$YTDLP"; remove_quarantine "$YTDLP"; echo; echo "yt-dlp installiert."; return 0; }
download_one_ffmpeg_tool(){ local name="$1" url="$2" dest="$3" tmpdir; tmpdir="$(mktemp -d)"; echo "$name fehlt. Lade $name herunter..."; echo; curl -L --fail "$url" -o "$tmpdir/$name.zip" || { echo "FEHLER: $name konnte nicht heruntergeladen werden."; rm -rf "$tmpdir"; return 1; }; unzip -q "$tmpdir/$name.zip" -d "$tmpdir/unzip"; local found; found="$(find "$tmpdir/unzip" -type f -name "$name" | head -n 1)"; [[ -z "$found" ]] && { echo "FEHLER: $name wurde im ZIP nicht gefunden."; rm -rf "$tmpdir"; return 1; }; cp "$found" "$dest"; chmod +x "$dest"; remove_quarantine "$dest"; rm -rf "$tmpdir"; echo "$name installiert."; echo; return 0; }
download_ffmpeg_tools(){ screen_header; echo "Prüfe ffmpeg / ffprobe..."; echo; [[ ! -x "$FFMPEG" ]] && download_one_ffmpeg_tool "ffmpeg" "https://evermeet.cx/ffmpeg/getrelease/zip" "$FFMPEG"; [[ ! -x "$FFPROBE" ]] && download_one_ffmpeg_tool "ffprobe" "https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip" "$FFPROBE"; }
ensure_tools(){ screen_header; echo "Prüfe Projektordner:"; echo "$APPDIR"; echo; echo "Temp-Ordner:"; echo "$TEMPDIR"; echo; [[ ! -x "$YTDLP" ]] && download_yt_dlp || true; [[ ! -x "$FFMPEG" || ! -x "$FFPROBE" ]] && download_ffmpeg_tools || true; }
update_ytdlp(){ screen_header; echo "YT-DLP AKTUALISIEREN"; echo; [[ ! -x "$YTDLP" ]] && download_yt_dlp || "$YTDLP" -U; pause_key; }
update_ffmpeg(){ rm -f "$FFMPEG" "$FFPROBE"; download_ffmpeg_tools; pause_key; }
browser_process_name(){ case "$1" in chrome) echo "Google Chrome";; edge) echo "Microsoft Edge";; firefox) echo "Firefox";; brave) echo "Brave Browser";; safari) echo "Safari";; opera) echo "Opera";; *) echo "";; esac; }
warn_browser_running(){ local b="$1" appname; appname="$(browser_process_name "$b")"; [[ -z "$appname" ]] && return; if pgrep -x "$appname" >/dev/null 2>&1; then echo; echo "ACHTUNG:"; echo "$appname scheint noch zu laufen."; echo "Das kann verhindern, dass yt-dlp die Cookies lesen kann."; echo; echo "Bitte Browser komplett schliessen."; echo "Danach ENTER drücken, oder einfach ENTER zum Fortfahren."; read -r _; fi; }
ensure_finder_open(){ mkdir -p "$DOWNLOAD_DIR"; osascript >/dev/null 2>&1 <<EOF
set targetPath to POSIX file "$DOWNLOAD_DIR" as alias
set foundWindow to false
tell application "Finder"
  repeat with w in Finder windows
    try
      if (target of w as alias) is targetPath then set foundWindow to true
    end try
  end repeat
  if foundWindow is false then open targetPath
end tell
EOF
[[ $? -ne 0 ]] && open "$DOWNLOAD_DIR" >/dev/null 2>&1 || true; }
platform_hint(){ local u; u="$(echo "$1"|tr '[:upper:]' '[:lower:]')"; [[ "$u" == *"instagram.com"* ]]&&echo Instagram&&return; [[ "$u" == *"youtube.com"* || "$u" == *"youtu.be"* ]]&&echo YouTube&&return; [[ "$u" == *"facebook.com"* || "$u" == *"fb.watch"* ]]&&echo Facebook&&return; [[ "$u" == *"tiktok.com"* ]]&&echo TikTok&&return; [[ "$u" == *"vimeo.com"* ]]&&echo Vimeo&&return; [[ "$u" == *"twitter.com"* || "$u" == *"x.com"* ]]&&echo 'X/Twitter'&&return; echo Unbekannt; }
build_auth_args(){ AUTH_ARGS=(); case "$1" in none);; cookies_txt) [[ -f "$COOKIES_TXT" ]] && AUTH_ARGS+=(--cookies "$COOKIES_TXT") || echo "WARNUNG: cookies.txt fehlt. Es wird ohne Cookies versucht.";; browser) local b="${2:-$BROWSER}"; warn_browser_running "$b"; AUTH_ARGS+=(--cookies-from-browser "$b");; auto) warn_browser_running "$BROWSER"; AUTH_ARGS+=(--cookies-from-browser "$BROWSER");; esac; }
newest_mp4_after(){ local folder="$1" start_epoch="$2"; find "$folder" -type f -name "*.mp4" ! -name "* - WhatsApp.mp4" -print0 2>/dev/null | while IFS= read -r -d '' f; do local m; m="$(stat -f %m "$f" 2>/dev/null || echo 0)"; [[ "$m" -ge "$((start_epoch-60))" ]] && echo "$m|$f"; done | sort -rn | head -n 1 | cut -d'|' -f2-; }
convert_whatsapp_to_target(){ local input="$1"; [[ ! -x "$FFMPEG" ]] && { echo; echo "WhatsApp-Kopie übersprungen: ffmpeg fehlt."; return 1; }; [[ ! -f "$input" ]] && { echo; echo "WhatsApp-Kopie übersprungen: Eingabedatei fehlt."; return 1; }; local name out; name="$(basename "$input" .mp4)"; out="$DOWNLOAD_DIR/$name.mp4"; echo; echo "Erstelle WhatsApp-kompatible Datei..."; echo "$out"; echo; "$FFMPEG" -y -i "$input" -map 0:v:0 -map 0:a? -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -ac 2 -movflags +faststart "$out"; [[ $? -eq 0 ]] && { echo; echo "WhatsApp-kompatible Datei erstellt."; return 0; } || { echo; echo "WhatsApp-Konvertierung fehlgeschlagen."; return 1; }; }
prepare_temp(){ mkdir -p "$TEMPDIR"; rm -f "$TEMPDIR"/*.mp4 "$TEMPDIR"/*.webm "$TEMPDIR"/*.mkv "$TEMPDIR"/*.part "$TEMPDIR"/*.ytdl 2>/dev/null || true; }
run_download(){ local url="$1" auth_mode="$2" browser_override="${3:-}"; [[ ! -x "$YTDLP" ]] && { download_yt_dlp || return 1; }; mkdir -p "$DOWNLOAD_DIR" "$TEMPDIR"; ensure_finder_open; local workdir="$DOWNLOAD_DIR"; if [[ "$WHATSAPP_COPY" == "yes" ]]; then workdir="$TEMPDIR"; prepare_temp; fi; local platform start_epoch; platform="$(platform_hint "$url")"; start_epoch="$(date +%s)"; screen_header; echo "VIDEO HERUNTERLADEN"; echo; echo "Plattform erkannt: $platform"; echo "Zielordner:"; echo "$DOWNLOAD_DIR"; if [[ "$WHATSAPP_COPY" == "yes" ]]; then echo; echo "WhatsApp-Kopie aktiv:"; echo "Download läuft zuerst in den Temp-Ordner."; echo "Danach wird nur die kompatible Datei in den Zielordner geschrieben."; fi; echo; echo "Download startet..."; echo; log_line "========================================="; log_line "Download gestartet: $(date)"; log_line "URL: $url"; log_line "DownloadDir: $DOWNLOAD_DIR"; log_line "WorkDir: $workdir"; log_line "Browser: $BROWSER"; log_line "CookieMode: $auth_mode"; log_line "WhatsAppCopy: $WHATSAPP_COPY"; build_auth_args "$auth_mode" "$browser_override"; "$YTDLP" "${AUTH_ARGS[@]}" -P "$workdir" -S "vcodec:h264,res,ext:mp4:m4a" -f "bv*+ba/b" --merge-output-format mp4 --no-playlist -o "%(title).120B [%(id)s].%(ext)s" "$url"; local code=$?; log_line "yt-dlp Ergebniscode: $code"; if [[ $code -eq 0 ]]; then echo; echo "Download erfolgreich."; log_line "Download erfolgreich."; local f; f="$(newest_mp4_after "$workdir" "$start_epoch")"; if [[ -n "$f" ]]; then log_line "Datei: $f"; if [[ "$WHATSAPP_COPY" == "yes" ]]; then convert_whatsapp_to_target "$f"; local c=$?; rm -f "$f" 2>/dev/null || true; return $c; else return 0; fi; else echo "Hinweis: heruntergeladene MP4-Datei wurde nicht eindeutig gefunden."; return 0; fi; else echo; echo "Der Download ist fehlgeschlagen."; explain_error; return "$code"; fi; }
explain_error(){ echo; echo "Mögliche Ursachen:"; echo "- Instagram/Facebook verlangt eine Anmeldung."; echo "- Die Browser-Cookie-Datenbank ist gesperrt."; echo "- Der Browser war noch offen."; echo "- Der Beitrag ist nicht öffentlich erreichbar."; echo "- yt-dlp ist veraltet."; echo; }
fallback_menu(){ local url="$1"; while true; do screen_header; echo "DOWNLOAD FEHLGESCHLAGEN"; echo; echo "Was möchtest du versuchen?"; echo; echo "1) Ohne Cookies versuchen"; echo "2) cookies.txt verwenden"; echo "3) Chrome verwenden"; echo "4) Edge verwenden"; echo "5) Firefox verwenden"; echo "6) Brave verwenden"; echo "7) Safari verwenden"; echo "8) Opera verwenden"; echo "9) yt-dlp aktualisieren und erneut versuchen"; echo "0) Abbrechen"; echo; read -r -p "Auswahl: " c; case "$c" in 1) run_download "$url" none; pause_key; return;; 2) run_download "$url" cookies_txt; pause_key; return;; 3) run_download "$url" browser chrome; pause_key; return;; 4) run_download "$url" browser edge; pause_key; return;; 5) run_download "$url" browser firefox; pause_key; return;; 6) run_download "$url" browser brave; pause_key; return;; 7) run_download "$url" browser safari; pause_key; return;; 8) run_download "$url" browser opera; pause_key; return;; 9) "$YTDLP" -U; run_download "$url" "$COOKIE_MODE"; pause_key; return;; 0) return;; esac; done; }
download_menu(){ while true; do screen_header; echo "VIDEO HERUNTERLADEN"; echo; echo "Downloadordner:"; echo "$DOWNLOAD_DIR"; echo; echo "Beim Download wird der Zielordner im Finder geöffnet,"; echo "falls er nicht bereits geöffnet ist."; echo; echo "Mehrere Links nacheinander möglich."; echo "Leere Eingabe = zurück ins Hauptmenü."; echo; read -r -p "Link einfügen: " url; [[ -z "$url" ]] && return; run_download "$url" "$COOKIE_MODE"; local code=$?; [[ $code -ne 0 ]] && fallback_menu "$url" || pause_key; done; }
select_browser(){ screen_header; echo "BROWSER AUSWÄHLEN"; echo; echo "1) Chrome"; echo "2) Edge"; echo "3) Firefox"; echo "4) Brave"; echo "5) Safari"; echo "6) Opera"; echo; read -r -p "Auswahl: " c; case "$c" in 1) BROWSER=chrome;; 2) BROWSER=edge;; 3) BROWSER=firefox;; 4) BROWSER=brave;; 5) BROWSER=safari;; 6) BROWSER=opera;; esac; save_config; echo; echo "Gespeichert: $BROWSER"; pause_key; }
select_cookie_mode(){ screen_header; echo "COOKIE-MODUS"; echo; echo "Aktuell: $COOKIE_MODE"; echo; echo "1) Auto = Browser-Cookies vom gewählten Browser"; echo "2) Nur Browser-Cookies"; echo "3) Nur cookies.txt"; echo "4) Ohne Cookies"; echo; read -r -p "Auswahl: " c; case "$c" in 1) COOKIE_MODE=auto;; 2) COOKIE_MODE=browser;; 3) COOKIE_MODE=cookies_txt;; 4) COOKIE_MODE=none;; esac; save_config; echo; echo "Gespeichert: $COOKIE_MODE"; pause_key; }
toggle_whatsapp(){ screen_header; [[ "$WHATSAPP_COPY" == yes ]] && WHATSAPP_COPY=no || WHATSAPP_COPY=yes; save_config; echo "WhatsApp-Kopie: $WHATSAPP_COPY"; pause_key; }
change_download_dir(){ screen_header; echo "DOWNLOADORDNER ÄNDERN"; echo; echo "Aktueller Ordner:"; echo "$DOWNLOAD_DIR"; echo; echo "Enter ohne Eingabe = aktuellen Ordner behalten."; echo; read -r -p "Neuen Ordner eingeben: " newdir; if [[ -n "$newdir" ]]; then DOWNLOAD_DIR="${newdir/#\~/$HOME}"; mkdir -p "$DOWNLOAD_DIR"; save_config; fi; echo; echo "Gespeichert:"; echo "$DOWNLOAD_DIR"; pause_key; }
show_targets(){ screen_header; echo "GESPEICHERTE ZIELE"; echo; local n=1; while IFS='|' read -r name path; do [[ -z "$name" ]] && continue; echo "$n) $name"; echo "   $path"; n=$((n+1)); done < "$TARGETS"; pause_key; }
select_target_folder(){ screen_header; echo "ZIELORDNER AUSWÄHLEN"; echo; mapfile -t lines < "$TARGETS"; local i=1; for line in "${lines[@]}"; do IFS='|' read -r name path <<< "$line"; [[ -z "$name" ]] && continue; echo "$i) $name"; echo "   $path"; i=$((i+1)); done; echo; echo "0) Abbrechen"; echo; read -r -p "Auswahl: " c; [[ "$c" == 0 ]] && return; if [[ "$c" =~ ^[0-9]+$ ]] && (( c>=1 && c<=${#lines[@]} )); then IFS='|' read -r name path <<< "${lines[$((c-1))]}"; DOWNLOAD_DIR="${path/#\~/$HOME}"; mkdir -p "$DOWNLOAD_DIR"; save_config; echo; echo "Ausgewählt:"; echo "$DOWNLOAD_DIR"; fi; pause_key; }
save_current_target(){ screen_header; echo "AKTUELLEN ZIELORDNER SPEICHERN"; echo; echo "Pfad:"; echo "$DOWNLOAD_DIR"; echo; read -r -p "Name für diesen Eintrag: " name; [[ -z "$name" ]] && return; echo "$name|$DOWNLOAD_DIR" >> "$TARGETS"; echo; echo "Gespeichert."; pause_key; }
add_new_target(){ screen_header; echo "NEUEN ZIELORDNER SPEICHERN"; echo; read -r -p "Name: " name; [[ -z "$name" ]] && return; read -r -p "Pfad: " path; [[ -z "$path" ]] && return; path="${path/#\~/$HOME}"; mkdir -p "$path"; echo "$name|$path" >> "$TARGETS"; echo; echo "Gespeichert."; pause_key; }
delete_target(){ screen_header; echo "EINTRAG LÖSCHEN"; echo; mapfile -t lines < "$TARGETS"; local i=1; for line in "${lines[@]}"; do IFS='|' read -r name path <<< "$line"; [[ -z "$name" ]] && continue; echo "$i) $name"; echo "   $path"; i=$((i+1)); done; echo; echo "0) Abbrechen"; echo; read -r -p "Welchen Eintrag löschen: " c; [[ "$c" == 0 ]] && return; if [[ "$c" =~ ^[0-9]+$ ]] && (( c>=1 && c<=${#lines[@]} )); then : > "$TARGETS"; for idx in "${!lines[@]}"; do (( idx != c-1 )) && echo "${lines[$idx]}" >> "$TARGETS"; done; echo; echo "Eintrag gelöscht."; fi; pause_key; }
target_folder_menu(){ while true; do screen_header; echo "ZIELORDNER-VERZEICHNIS"; echo; echo "Aktueller Downloadordner:"; echo "$DOWNLOAD_DIR"; echo; echo "1) Zielordner aus Verzeichnis auswählen"; echo "2) Aktuellen Zielordner im Verzeichnis speichern"; echo "3) Neuen Zielordner speichern"; echo "4) Eintrag löschen"; echo "5) Einträge anzeigen"; echo "0) Zurück"; echo; read -r -p "Auswahl: " c; case "$c" in 1) select_target_folder;; 2) save_current_target;; 3) add_new_target;; 4) delete_target;; 5) show_targets;; 0) return;; esac; done; }
clean_cache(){ screen_header; echo "CACHE LÖSCHEN"; echo; [[ -x "$YTDLP" ]] && "$YTDLP" --rm-cache-dir || echo "yt-dlp fehlt."; pause_key; }
show_log(){ screen_header; echo "LOG"; echo; [[ -f "$LOG" ]] && cat "$LOG" || echo "Noch kein Log vorhanden."; pause_key; }
show_info(){ screen_header; echo "INFO"; echo; echo "Nelly Downloader Mac v1.1"; echo; echo "Neu:"; echo "- Temp-Ordner im Projektordner"; echo "- Wenn WhatsApp-Kopie aktiv ist, landet nur diese im Zielordner"; echo "- Terminal wird nach Aktionen neu aufgebaut"; echo; pause_key; }
main_menu(){ while true; do screen_header; echo "Browser:          $BROWSER"; echo "Cookie-Modus:     $COOKIE_MODE"; echo "WhatsApp-Kopie:   $WHATSAPP_COPY"; echo "Projektordner:"; echo "$APPDIR"; echo "Temp-Ordner:"; echo "$TEMPDIR"; echo "Downloadordner:"; echo "$DOWNLOAD_DIR"; echo; echo "1) Video herunterladen"; echo "2) Browser auswählen"; echo "3) Cookie-Modus auswählen"; echo "4) Downloadordner direkt ändern"; echo "5) Zielordner-Verzeichnis"; echo "6) WhatsApp-Kopie ein/aus"; echo "7) yt-dlp aktualisieren"; echo "8) ffmpeg / ffprobe aktualisieren"; echo "9) Cache löschen"; echo "l) Log anzeigen"; echo "i) Info"; echo "0) Beenden"; echo; read -r -p "Auswahl: " c; case "$c" in 1) download_menu;; 2) select_browser;; 3) select_cookie_mode;; 4) change_download_dir;; 5) target_folder_menu;; 6) toggle_whatsapp;; 7) update_ytdlp;; 8) update_ffmpeg;; 9) clean_cache;; l|L) show_log;; i|I) show_info;; 0) exit 0;; esac; done; }
load_config
ensure_targets
ensure_project_dirs
ensure_tools
main_menu
