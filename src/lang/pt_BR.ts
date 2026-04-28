import enUS from "@/lang/en_US";

const lang = {
    ...enUS,
    common: { select: "Selecionar", delete: "Excluir", authorized: "Autorizado", unauthorized: "Não autorizado", or: "ou" },
    nav: { home: "Início", games: "Jogos", manager: "Gerenciador", explore: "Explorar", download: "Downloads", mcp: "MCP", backup: "Backup", about: "Sobre", settings: "Configurações", aiChat: "Chat IA" },
    home: { welcome: "Bem-vindo ao Gloss Mod Manager. Aqui você pode gerenciar seus mods rapidamente.", partners: "Parceiros" },
    settings: { ...enUS.settings, title: "Configurações", basic: "Básico", storagePath: "Caminho de armazenamento", choose: "Escolher", theme: "Tema", chooseTheme: "Escolher tema", themeSystem: "Seguir sistema", themeLight: "Claro", themeDark: "Escuro", language: "Idioma", chooseLanguage: "Escolher idioma", defaultStartPage: "Página inicial padrão", chooseDefaultStartPage: "Escolher página inicial", autoAddAfterDownload: "Importar automaticamente após baixar", selectGameByFolder: "Selecionar jogo por pasta", autoStart: "Iniciar ao entrar", modifiableDuringGame: "Permitir alterações com o jogo em execução", showPreloadList: "Mostrar lista de pré-requisitos", closeSoftLinks: "Desativar instalação por link simbólico", authorization: "Autorização", advanced: "Configurações avançadas", debugMode: "Modo de depuração", debugInfo: "Informações de depuração" },
    games: { ...enUS.games, library: "Biblioteca de jogos", selectGame: "Selecionar jogo", searchGame: "Pesquisar jogos", notFound: "Caminho do jogo não encontrado", openGameFolder: "Abrir pasta do jogo", openModFolder: "Abrir pasta de mods" },
};

export default lang;
