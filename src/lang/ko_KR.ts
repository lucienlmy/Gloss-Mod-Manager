import enUS from "@/lang/en_US";

const lang = {
    ...enUS,
    common: { select: "선택", delete: "삭제", authorized: "인증됨", unauthorized: "미인증", or: "또는" },
    nav: { home: "홈", games: "게임", manager: "관리", explore: "탐색", download: "다운로드", mcp: "MCP", backup: "백업", about: "정보", settings: "설정", aiChat: "AI 채팅" },
    home: { welcome: "Gloss Mod Manager에 오신 것을 환영합니다. 여기에서 Mod를 빠르게 관리할 수 있습니다.", partners: "파트너" },
    settings: { ...enUS.settings, title: "설정", basic: "기본 설정", storagePath: "저장 경로", choose: "선택", theme: "테마", chooseTheme: "테마 선택", themeSystem: "시스템 따르기", themeLight: "라이트", themeDark: "다크", language: "언어", chooseLanguage: "언어 선택", defaultStartPage: "기본 시작 페이지", chooseDefaultStartPage: "기본 시작 페이지 선택", autoAddAfterDownload: "다운로드 후 자동 가져오기", selectGameByFolder: "폴더로 게임 선택", autoStart: "로그인 시 시작", modifiableDuringGame: "게임 실행 중 변경 허용", showPreloadList: "선행 목록 표시", closeSoftLinks: "심볼릭 링크 설치 비활성화", authorization: "인증", advanced: "고급 설정", debugMode: "디버그 모드", debugInfo: "디버그 정보" },
    games: { ...enUS.games, library: "게임 라이브러리", selectGame: "게임 선택", searchGame: "게임 검색", notFound: "게임 경로를 찾을 수 없습니다", openGameFolder: "게임 폴더 열기", openModFolder: "Mod 폴더 열기" },
};

export default lang;
