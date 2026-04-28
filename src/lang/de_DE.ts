import enUS from "@/lang/en_US";

const lang = {
    ...enUS,
    common: { select: "Auswählen", delete: "Löschen", authorized: "Autorisiert", unauthorized: "Nicht autorisiert", or: "oder" },
    nav: { home: "Start", games: "Spiele", manager: "Manager", explore: "Entdecken", download: "Downloads", mcp: "MCP", backup: "Backup", about: "Über", settings: "Einstellungen", aiChat: "KI-Chat" },
    home: { welcome: "Willkommen bei Gloss Mod Manager. Hier kannst du Mods schnell verwalten.", partners: "Partner" },
    settings: { ...enUS.settings, title: "Einstellungen", basic: "Allgemein", storagePath: "Speicherpfad", choose: "Auswählen", theme: "Design", chooseTheme: "Design wählen", themeSystem: "System folgen", themeLight: "Hell", themeDark: "Dunkel", language: "Sprache", chooseLanguage: "Sprache wählen", defaultStartPage: "Standard-Startseite", chooseDefaultStartPage: "Startseite wählen", autoAddAfterDownload: "Nach Download automatisch importieren", selectGameByFolder: "Spiel über Ordner auswählen", autoStart: "Beim Anmelden starten", modifiableDuringGame: "Änderungen während des Spiels erlauben", showPreloadList: "Voraussetzungsliste anzeigen", closeSoftLinks: "Symlink-Installation deaktivieren", authorization: "Autorisierung", advanced: "Erweiterte Einstellungen", debugMode: "Debug-Modus", debugInfo: "Debug-Informationen" },
    games: { ...enUS.games, library: "Spielbibliothek", selectGame: "Spiel auswählen", searchGame: "Spiele suchen", notFound: "Spielpfad nicht gefunden", openGameFolder: "Spielordner öffnen", openModFolder: "Mod-Ordner öffnen" },
};

export default lang;
