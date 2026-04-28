import enUS from "@/lang/en_US";

const lang = {
    ...enUS,
    common: { select: "Sélectionner", delete: "Supprimer", authorized: "Autorisé", unauthorized: "Non autorisé", or: "ou" },
    nav: { home: "Accueil", games: "Jeux", manager: "Gestion", explore: "Explorer", download: "Téléchargements", mcp: "MCP", backup: "Sauvegarde", about: "À propos", settings: "Paramètres", aiChat: "Chat IA" },
    home: { welcome: "Bienvenue dans Gloss Mod Manager. Vous pouvez y gérer rapidement vos mods.", partners: "Partenaires" },
    settings: { ...enUS.settings, title: "Paramètres", basic: "Général", storagePath: "Chemin de stockage", choose: "Choisir", theme: "Thème", chooseTheme: "Choisir un thème", themeSystem: "Suivre le système", themeLight: "Clair", themeDark: "Sombre", language: "Langue", chooseLanguage: "Choisir la langue", defaultStartPage: "Page de démarrage par défaut", chooseDefaultStartPage: "Choisir la page de démarrage", autoAddAfterDownload: "Importer automatiquement après téléchargement", selectGameByFolder: "Sélectionner le jeu par dossier", autoStart: "Lancer à la connexion", modifiableDuringGame: "Autoriser les modifications pendant le jeu", showPreloadList: "Afficher la liste des prérequis", closeSoftLinks: "Désactiver l'installation par liens symboliques", authorization: "Autorisation", advanced: "Paramètres avancés", debugMode: "Mode débogage", debugInfo: "Informations de débogage" },
    games: { ...enUS.games, library: "Bibliothèque de jeux", selectGame: "Sélectionner un jeu", searchGame: "Rechercher des jeux", notFound: "Chemin du jeu introuvable", openGameFolder: "Ouvrir le dossier du jeu", openModFolder: "Ouvrir le dossier des mods" },
};

export default lang;
