import zhCN from "@/lang/zh_CN";

const gameNames = Object.fromEntries(
    Object.entries(zhCN)
        .filter(([, value]) => typeof value === "string")
        .map(([key]) => [key, key]),
);

const lang = {
    ...gameNames,
    common: {
        select: "Select",
        delete: "Delete",
        authorized: "Authorized",
        unauthorized: "Unauthorized",
        or: "or",
    },
    nav: {
        home: "Home",
        games: "Games",
        manager: "Manager",
        explore: "Explore",
        download: "Download",
        mcp: "MCP",
        backup: "Backup",
        about: "About",
        settings: "Settings",
        aiChat: "AI Chat",
    },
    home: {
        welcome:
            "Welcome to Gloss Mod Manager. Here you can manage your mods quickly.",
        partners: "Partners",
    },
    settings: {
        title: "Settings",
        basic: "Basic",
        storagePath: "Storage path",
        choose: "Choose",
        theme: "Theme",
        chooseTheme: "Choose theme",
        themeSystem: "Follow system",
        themeLight: "Light",
        themeDark: "Dark",
        language: "Language",
        chooseLanguage: "Choose language",
        defaultStartPage: "Default start page",
        chooseDefaultStartPage: "Choose default start page",
        autoAddAfterDownload: "Auto import after download",
        selectGameByFolder: "Select game by folder",
        autoStart: "Start at login",
        modifiableDuringGame: "Allow changes while game is running",
        showPreloadList: "Show preload list",
        closeSoftLinks: "Disable symlink install",
        authorization: "Authorization",
        advanced: "Advanced settings",
        debugMode: "Debug mode",
        debugInfo: "Debug information",
        pages: {
            home: "Home",
            games: "Games",
            manager: "Manager",
            explore: "Explore",
            download: "Download",
            mcp: "MCP",
            backup: "Backup",
            about: "About",
            settings: "Settings",
        },
        autoStartError: "Failed to update start-at-login setting",
        nexus: {
            authorizeSuccess: "{name} authorized successfully",
            authorizeFailed: "NexusMods authorization failed",
            cleared: "NexusMods authorization cleared",
            openProfileFailed: "Failed to open NexusMods profile",
            statusAuthorized: "Authorized",
            statusUnauthorized: "Unauthorized",
            currentAccount: "Current account: {name} (ID: {id})",
            ssoRequired:
                "NexusMods browsing and downloads require SSO authorization first.",
            reauthorize: "Reauthorize",
            login: "Log in to NexusMods",
            openProfile: "Open profile",
            clearAuthorization: "Clear authorization",
        },
    },
    games: {
        library: "Game library",
        selectGame: "Select game",
        searchGame: "Search games",
        totalCount: "{total} games",
        matchedCount: "{matched} / {total} games matched",
        executableFilter: "Game executable",
        selectExecutableTitle: "Please select the location of {exe}",
        selectFolderError: "Please select the folder that contains {exe}.",
        notFound: "Game path not found",
        openGameFolder: "Open game folder",
        openModFolder: "Open mod folder",
        noMatches:
            "No matching games found. Try the original name or translated name.",
    },
};

export default lang;
