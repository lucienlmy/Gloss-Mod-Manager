import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 霍格沃茨之遗 安装
 */
export const supportedGames = async () => ({
    GlossGameId: 302,
    steamAppID: 990080,
    nexusMods: {
        game_domain_name: "hogwartslegacy",
        game_id: 5113,
    },
    curseforge: 87986,
    installdir: "HogwartsLegacy",
    gameName: "Hogwarts Legacy",
    gameExe: "HogwartsLegacy.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/990080",
        },
        {
            name: "直接启动",
            exePath: "HogwartsLegacy.exe",
        },
    ],
    archivePath: await join(
        await FileHandler.GetAppData(),
        "Local",
        "HogwartsLegacy",
        "Saved"
    ),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/game/63e2f9656f092.webp",
    modType: await UnrealEngine.modType("Phoenix", false),
    checkModType: UnrealEngine.checkModType,
}) as ISupportedGames;
