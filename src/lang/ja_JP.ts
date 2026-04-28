import enUS from "@/lang/en_US";

const lang = {
    ...enUS,
    common: { select: "選択", delete: "削除", authorized: "認証済み", unauthorized: "未認証", or: "または" },
    nav: { home: "ホーム", games: "ゲーム", manager: "管理", explore: "探索", download: "ダウンロード", mcp: "MCP", backup: "バックアップ", about: "概要", settings: "設定", aiChat: "AI チャット" },
    home: { welcome: "Gloss Mod Manager へようこそ。ここで Mod をすばやく管理できます。", partners: "パートナー" },
    settings: { ...enUS.settings, title: "設定", basic: "基本設定", storagePath: "保存先", choose: "選択", theme: "テーマ", chooseTheme: "テーマを選択", themeSystem: "システムに従う", themeLight: "ライト", themeDark: "ダーク", language: "言語", chooseLanguage: "言語を選択", defaultStartPage: "既定の開始ページ", chooseDefaultStartPage: "既定の開始ページを選択", autoAddAfterDownload: "ダウンロード後に自動インポート", selectGameByFolder: "フォルダーでゲームを選択", autoStart: "ログイン時に起動", modifiableDuringGame: "ゲーム実行中の変更を許可", showPreloadList: "前提リストを表示", closeSoftLinks: "シンボリックリンクインストールを無効化", authorization: "認証", advanced: "詳細設定", debugMode: "デバッグモード", debugInfo: "デバッグ情報" },
    games: { ...enUS.games, library: "ゲームライブラリ", selectGame: "ゲームを選択", searchGame: "ゲームを検索", notFound: "ゲームパスが見つかりません", openGameFolder: "ゲームフォルダーを開く", openModFolder: "Mod フォルダーを開く" },
};

export default lang;
