/**
 * @description 最终幻想 7 重生 支持
 */


import { join } from 'path'

export const supportedGames: ISupportedGames = {
    GlossGameId: 414,
    steamAppID: 2909400,
    nexusMods: {
        game_domain_name: "finalfantasy7rebirth",
        game_id: 7237
    },
    // curseforge: 4593,
    installdir: join("FINAL FANTASY VII REBIRTH"),
    gameName: "FINAL FANTASY VII REBIRTH",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1462040"
        },
        {
            name: "直接启动",
            exePath: "ff7rebirth.exe"
        }
    ],
    gameExe: "ff7rebirth.exe",
    archivePath: join(FileHandler.getMyDocuments(), "My Games", "FINAL FANTASY VII REBIRTH"),
    gameCoverImg: "https://mod.3dmgame.com/static/upload/logo/croppedImg_683582d5e4a77.jpg",
    modType: UnrealEngine.modType("End", false),
    checkModType: UnrealEngine.checkModType
}
