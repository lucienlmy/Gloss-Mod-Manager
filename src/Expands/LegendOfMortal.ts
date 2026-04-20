import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 活侠传 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 357,
    steamAppID: 1859910,
    nexusMods: {
        game_domain_name: "legendofmortal",
        game_id: 6702
    },
    installdir: await join("LegendOfMortal"),
    gameName: "Legend Of Mortal",
    gameExe: "Mortal.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1859910"
        },
        {
            name: "直接启动",
            exePath: await join("Mortal.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "Obb Studio", "Mortal"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/667126e01ba80.webp",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
