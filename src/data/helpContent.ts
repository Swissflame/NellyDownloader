import { DEFAULT_KEYBOARD_SHORTCUTS, SHORTCUT_DESCRIPTIONS } from "../config/shortcuts";

export type HelpChapter = {
  id: string;
  title: string;
  body: string[];
  keywords: string[];
  table?: {
    headers: [string, string];
    rows: [string, string][];
  };
};

export const helpChapters: HelpChapter[] = [
  {
    id: "overview",
    title: "Ueberblick",
    body: [
      "Nelly Downloader ist eine lokale Desktop-App zum Analysieren und Herunterladen einzelner Video- oder Audiolinks.",
      "Die App arbeitet mit yt-dlp, ffprobe und ffmpeg. Lokale Datei- und Prozessfunktionen laufen im Electron Main-Prozess.",
      "Playlists werden nicht heruntergeladen. Jeder Start verarbeitet genau einen Link.",
    ],
    keywords: ["start", "workflow", "einzelner link", "playlist"],
  },
  {
    id: "first-start",
    title: "Erster Start",
    body: [
      "Beim ersten Start werden Standardwerte geladen. Einstellungen werden im lokalen App-Datenordner gespeichert.",
      "Pruefe zuerst den Zielordner und oeffne danach bei Bedarf die Einstellungen.",
      "Falls yt-dlp, ffprobe oder ffmpeg nicht im PATH liegen, nutzt die Entwicklungsfassung vorhandene Werkzeuge aus reference/Windows nur lesend.",
    ],
    keywords: ["erste schritte", "standardwerte", "tools"],
  },
  {
    id: "target-folder",
    title: "Zielordner einstellen",
    body: [
      "Der Zielordner legt fest, wohin Downloads geschrieben und welche Dateien in der Liste angezeigt werden.",
      "Die Auswahl erfolgt ueber den nativen Ordnerdialog in den Einstellungen.",
      "Dateiaktionen akzeptieren nur Dateien aus diesem Zielordner. Dateien ausserhalb des Zielordners werden nicht veraendert.",
    ],
    keywords: ["zielordner", "ordner", "dateiliste"],
  },
  {
    id: "analyze-link",
    title: "Link analysieren",
    body: [
      "Die Analyse liest Metadaten wie Titel, Plattform, Kanal, ID, Dauer und Thumbnail.",
      "Es wird dabei nichts heruntergeladen und keine Datei im Zielordner erzeugt.",
      "Nur http- und https-Links werden akzeptiert.",
    ],
    keywords: ["analyse", "metadaten", "thumbnail"],
  },
  {
    id: "download-video",
    title: "Video herunterladen",
    body: [
      "Der Button Download starten verarbeitet den eingegebenen Link entsprechend dem gewaehlten Downloadmodus.",
      "Linksklick startet mit dem eingetragenen Link. Rechtsklick liest eine http- oder https-URL aus der Zwischenablage, fuegt sie ein und startet sofort.",
      "Der Download laeuft im Main-Prozess. Die Oberflaeche zeigt Fortschritt und aktualisiert danach den Zielordner.",
      "Bestehende Dateien werden nicht ueberschrieben. Dateinamen enthalten Titel, ID und Zeitstempel.",
    ],
    keywords: ["download", "fortschritt", "dateiname", "zwischenablage", "rechtsklick"],
  },
  {
    id: "download-mode",
    title: "Downloadmodus",
    body: [
      "Automatisch ist der Standard: Bereits vorhandene Analysedaten werden genutzt, sonst startet der Download direkt.",
      "Erst analysieren, dann herunterladen zeigt zuerst Details und startet danach den Download.",
      "Direkt herunterladen vermeidet eine separate Analyse vor dem Download. Es werden keine zwei yt-dlp-Prozesse parallel fuer denselben Link gestartet.",
    ],
    keywords: ["downloadmodus", "automatisch", "direkt", "analysieren"],
  },
  {
    id: "keyboard-shortcuts",
    title: "Tastenkombinationen",
    body: [
      "Shortcuts funktionieren, wenn NellyDownloader aktiv ist.",
      "Normale Texteingaben werden geschuetzt: Ctrl+A markiert im Linkfeld weiter Text und Delete wirkt nicht im Linkfeld.",
      "Logitech-Tasten oder andere externe Bediengeraete koennen auf diese Tastenkombinationen gelegt werden.",
    ],
    keywords: ["shortcut", "tastenkombination", "logitech", "f1", "delete"],
    table: {
      headers: ["Tastenkombination", "Aktion"],
      rows: SHORTCUT_DESCRIPTIONS.map((shortcut) => [
        DEFAULT_KEYBOARD_SHORTCUTS[shortcut.action],
        shortcut.label,
      ]),
    },
  },
  {
    id: "whatsapp",
    title: "WhatsApp-Kompatibilitaet",
    body: [
      "Auto prueft die heruntergeladene Datei mit ffprobe und wandelt nur bei Bedarf um.",
      "Immer umwandeln erzeugt nach jedem Download eine neue MP4 mit H.264-Video und AAC-Audio.",
      "Nie umwandeln behaelt die heruntergeladene Originaldatei ohne ffmpeg-Konvertierung.",
    ],
    keywords: ["whatsapp", "ffmpeg", "ffprobe", "h264", "aac"],
  },
  {
    id: "original-after-conversion",
    title: "Originaldatei nach Umwandlung",
    body: [
      "Behalten ist der Standard. Originaldatei und WhatsApp-MP4 bleiben sichtbar.",
      "In Papierkorb verschieben greift nur nach erfolgreicher Umwandlung und Pruefung der neuen MP4.",
      "Wenn keine zusaetzliche MP4 erzeugt wurde oder die Pruefung fehlschlaegt, bleibt das Original erhalten.",
    ],
    keywords: ["original", "umwandlung", "papierkorb", "behalten"],
  },
  {
    id: "copy-files",
    title: "Dateien kopieren",
    body: [
      "Ausgewaehlte kopieren legt die markierten Dateien in die System-Zwischenablage.",
      "Unter Windows wird eine echte Dateiablage verwendet, sodass Einfuegen in WhatsApp Desktop oder Explorer moeglich ist.",
      "Andere Messenger wie Viber koennen je nach Version abweichend reagieren. Falls ein Messenger die Dateiablage nicht akzeptiert, fuege die Datei per Drag & Drop aus dem Zielordner ein.",
      "Falls Dateiablage nicht verfuegbar ist, werden Dateipfade als Text kopiert und die App meldet diesen Fallback.",
    ],
    keywords: ["kopieren", "zwischenablage", "whatsapp desktop", "explorer", "viber"],
  },
  {
    id: "trash-files",
    title: "Dateien in Papierkorb verschieben",
    body: [
      "Ausgewaehlte loeschen verschiebt Dateien nur nach Sicherheitsabfrage in den Papierkorb.",
      "Es gibt keine permanente Loeschfunktion in diesem Schritt.",
      "Nur Dateien im aktuellen Zielordner werden akzeptiert. Unterordner und Pfade ausserhalb des Zielordners werden abgelehnt.",
    ],
    keywords: ["loeschen", "papierkorb", "sicherheitsabfrage"],
  },
  {
    id: "instagram-cookies",
    title: "Instagram / Cookies / Browser",
    body: [
      "Instagram kann fuer private oder angemeldete Inhalte Browser-Cookies verlangen.",
      "Bei Browser Automatisch versucht die App unter Windows mehrere Browser wie Chrome, Edge, Firefox, Brave und Opera.",
      "Wenn ein Beitrag im Browser nicht erreichbar ist oder Cookies gesperrt sind, kann Analyse oder Download fehlschlagen.",
    ],
    keywords: ["instagram", "cookies", "browser", "chrome", "edge", "firefox"],
  },
  {
    id: "troubleshooting",
    title: "Fehlerbehebung",
    body: [
      "Wenn yt-dlp fehlt, lege den Pfad in den Einstellungen fest oder installiere yt-dlp im PATH.",
      "Wenn der Zielordner nicht gefunden wird, waehle ihn in den Einstellungen neu aus.",
      "Bei Instagram-Fehlern pruefe, ob der Beitrag im gewaehlten Browser geoeffnet werden kann.",
    ],
    keywords: ["fehler", "yt-dlp", "zielordner", "instagram"],
  },
  {
    id: "safety",
    title: "Sicherheitshinweise",
    body: [
      "Bitte lade nur Inhalte herunter, fuer die du Rechte oder Erlaubnis hast.",
      "Dateien ausserhalb des Zielordners werden von Kopieren und Papierkorb-Aktionen nicht veraendert.",
      "Papierkorb bedeutet nicht endgueltig loeschen. Trotzdem solltest du vor Dateiaktionen die Auswahl pruefen.",
    ],
    keywords: ["sicherheit", "rechte", "zielordner", "papierkorb"],
  },
  {
    id: "technical",
    title: "Version / technische Hinweise",
    body: [
      "Die App nutzt Electron mit getrenntem Renderer, Preload und Main-Prozess.",
      "Der Renderer hat keinen direkten Node-Zugriff. Dateisystem und externe Prozesse laufen ueber IPC im Main-Prozess.",
      "Einstellungen werden im App-Datenordner gespeichert, nicht im Projektordner.",
    ],
    keywords: ["version", "electron", "preload", "ipc", "technik"],
  },
];
