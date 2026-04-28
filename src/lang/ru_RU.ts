import enUS from "@/lang/en_US";

const lang = {
    ...enUS,
    common: { select: "Выбрать", delete: "Удалить", authorized: "Авторизовано", unauthorized: "Не авторизовано", or: "или" },
    nav: { home: "Главная", games: "Игры", manager: "Менеджер", explore: "Обзор", download: "Загрузки", mcp: "MCP", backup: "Резервные копии", about: "О программе", settings: "Настройки", aiChat: "AI-чат" },
    home: { welcome: "Добро пожаловать в Gloss Mod Manager. Здесь можно быстро управлять модами.", partners: "Партнеры" },
    settings: { ...enUS.settings, title: "Настройки", basic: "Основные", storagePath: "Путь хранения", choose: "Выбрать", theme: "Тема", chooseTheme: "Выбрать тему", themeSystem: "Как в системе", themeLight: "Светлая", themeDark: "Темная", language: "Язык", chooseLanguage: "Выбрать язык", defaultStartPage: "Стартовая страница", chooseDefaultStartPage: "Выбрать стартовую страницу", autoAddAfterDownload: "Автоимпорт после загрузки", selectGameByFolder: "Выбирать игру по папке", autoStart: "Запуск при входе", modifiableDuringGame: "Разрешить изменения во время игры", showPreloadList: "Показывать список требований", closeSoftLinks: "Отключить установку через symlink", authorization: "Авторизация", advanced: "Дополнительные настройки", debugMode: "Режим отладки", debugInfo: "Отладочная информация" },
    games: { ...enUS.games, library: "Библиотека игр", selectGame: "Выбрать игру", searchGame: "Поиск игр", notFound: "Путь к игре не найден", openGameFolder: "Открыть папку игры", openModFolder: "Открыть папку модов" },
};

export default lang;
