import { join } from "@tauri-apps/api/path";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 龙崖 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 235,
    steamAppID: 758190,
    installdir: await join("Dragon Cliff"),
    gameName: "Dragon Cliff",
    gameExe: "game.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/758190",
        },
        {
            name: "直接启动",
            exePath: await join("game.exe"),
        },
    ],
    // archivePath: join(await FileHandler.GetAppData(), "LocalLow", "Stunlock Studios", "VRising"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/235.png",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType,
}) as ISupportedGames;
