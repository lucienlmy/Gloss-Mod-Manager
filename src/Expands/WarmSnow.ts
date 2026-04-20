import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 暖雪 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 274,
    steamAppID: 1296830,
    installdir: await join("WarmSnow"),
    gameName: "WarmSnow",
    gameExe: "WarmSnow.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1296830"
        },
        {
            name: "直接启动",
            exePath: await join("WarmSnow.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "BadMudStudio", "WarmSnow"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/61eb6d1e3f646.png",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
