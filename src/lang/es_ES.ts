import enUS from "@/lang/en_US";

const lang = {
    ...enUS,
    common: { select: "Seleccionar", delete: "Eliminar", authorized: "Autorizado", unauthorized: "Sin autorizar", or: "o" },
    nav: { home: "Inicio", games: "Juegos", manager: "Gestor", explore: "Explorar", download: "Descargas", mcp: "MCP", backup: "Copias", about: "Acerca de", settings: "Ajustes", aiChat: "Chat IA" },
    home: { welcome: "Te damos la bienvenida a Gloss Mod Manager. Aquí puedes gestionar tus mods rápidamente.", partners: "Socios" },
    settings: { ...enUS.settings, title: "Ajustes", basic: "Básico", storagePath: "Ruta de almacenamiento", choose: "Elegir", theme: "Tema", chooseTheme: "Elegir tema", themeSystem: "Seguir el sistema", themeLight: "Claro", themeDark: "Oscuro", language: "Idioma", chooseLanguage: "Elegir idioma", defaultStartPage: "Página de inicio predeterminada", chooseDefaultStartPage: "Elegir página de inicio", autoAddAfterDownload: "Importar automáticamente tras descargar", selectGameByFolder: "Seleccionar juego por carpeta", autoStart: "Iniciar al entrar", modifiableDuringGame: "Permitir cambios con el juego en ejecución", showPreloadList: "Mostrar lista de requisitos", closeSoftLinks: "Desactivar instalación con enlaces simbólicos", authorization: "Autorización", advanced: "Ajustes avanzados", debugMode: "Modo de depuración", debugInfo: "Información de depuración" },
    games: { ...enUS.games, library: "Biblioteca de juegos", selectGame: "Seleccionar juego", searchGame: "Buscar juegos", notFound: "No se encontró la ruta del juego", openGameFolder: "Abrir carpeta del juego", openModFolder: "Abrir carpeta de mods" },
};

export default lang;
