/**
 * @description 龙崖 支持
 */

import { join } from "node:path";

export const supportedGames: ISupportedGames = {
    GlossGameId: 235,
    steamAppID: 758190,
    installdir: join("Dragon Cliff"),
    gameName: "Dragon Cliff",
    gameExe: "game.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/758190",
        },
        {
            name: "直接启动",
            exePath: join("game.exe"),
        },
    ],
    // archivePath: join(FileHandler.GetAppData(), "LocalLow", "Stunlock Studios", "VRising"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/235.png",
    modType: UnityGame.modType,
    checkModType: UnityGame.checkModType,
};
