/**
 * @description 庄园领主 支持
 */

import { join } from 'path'


export const supportedGames: ISupportedGames = {
    GlossGameId: 348,
    steamAppID: 1363080,
    nexusMods: {
        game_domain_name: "manorlords",
        game_id: 6352
    },
    installdir: join("Manor Lords"),
    gameName: "Manor Lords",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1363080"
        },
        {
            name: "直接启动",
            exePath: "ManorLords.exe"
        }
    ],
    gameExe: "ManorLords.exe",
    archivePath: join(FileHandler.GetAppData(), "Local", "ManorLords", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/662db2a8b4521.webp",
    modType: UnrealEngine.modType("ManorLords", false),
    checkModType: UnrealEngine.checkModType
}