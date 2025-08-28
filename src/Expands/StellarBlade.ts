/**
 * @description 剑星 支持
 */

import { join } from 'path'


export const supportedGames: ISupportedGames = {
    GlossGameId: 437,
    steamAppID: 3489700,
    nexusMods: {
        game_domain_name: "stellarblade",
        game_id: 7804
    },
    installdir: join("StellarBlade"),
    gameName: "Stellar Blade",
    gameExe: "SB.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/3489700"
        },
        {
            name: "直接启动",
            exePath: "SB.exe"
        }
    ],
    // archivePath: join(FileHandler.GetAppData(), "Local", "Pal7", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_683eb2f1cdd6b.jpg",
    modType: UnrealEngine.modType("SB", false),
    checkModType: UnrealEngine.checkModType
}