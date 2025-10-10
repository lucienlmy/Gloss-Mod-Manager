/**
 * @description 师父 支持
 */

import { basename, join, extname } from "node:path";

export const supportedGames: ISupportedGames = {
    GlossGameId: 64,
    steamAppID: 2138710,
    nexusMods: {
        game_domain_name: "sifu",
        game_id: 4309,
    },
    installdir: join("Sifu"),
    gameName: "SiFu",
    gameExe: "Sifu.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2138710",
        },
        {
            name: "直接启动",
            exePath: join("Sifu.exe"),
        },
    ],
    archivePath: join(FileHandler.GetAppData(), "Local", "Sifu", "Saved"),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/game/62207195e18a2.png",
    modType: UnrealEngine.modType("Sifu", false),
    checkModType: UnrealEngine.checkModType,
};
