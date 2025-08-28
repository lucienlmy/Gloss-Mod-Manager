/**
 * @description 铁拳8 支持
 */

import { join } from 'path'


export const supportedGames: ISupportedGames = {
    GlossGameId: 335,
    steamAppID: 1778820,
    nexusMods: {
        game_domain_name: "tekken8",
        game_id: 5622
    },
    installdir: join("TEKKEN 8"),
    gameName: "Tekken 8",
    gameExe: "TEKKEN 8.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1778820"
        },
        {
            name: "直接启动",
            exePath: "TEKKEN 8.exe"
        }
    ],
    archivePath: join(FileHandler.GetAppData(), "Local", "TEKKEN 8", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/65b9e69f3b61b.webp",
    modType: UnrealEngine.modType("Polaris", false),
    checkModType: UnrealEngine.checkModType
}