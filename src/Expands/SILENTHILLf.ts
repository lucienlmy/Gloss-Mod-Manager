/**
 * @description 寂静岭 F 支持
 */

import { join } from "node:path";

export const supportedGames: ISupportedGames = {
    GlossGameId: 461,
    steamAppID: 2947440,
    nexusMods: {
        game_domain_name: "silenthillf",
        game_id: 8203,
    },
    installdir: join("Silent Hill f"),
    gameName: "Silent Hill f",
    gameExe: "SHf.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2947440",
        },
        {
            name: "直接启动",
            exePath: join("SHf.exe"),
        },
    ],
    archivePath: join(FileHandler.GetAppData(), "Local", "SHf", "Saved"),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_68d35aebce565.png",
    modType: UnrealEngine.modType("SHf", false),
    checkModType: UnrealEngine.checkModType,
};
