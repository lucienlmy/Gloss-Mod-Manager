/**
 * @description 刀剑江湖路 支持
 */

import { join } from "node:path"

export const supportedGames: ISupportedGames = {
    GlossGameId: 383,
    steamAppID: 2361680,
    nexusMods: {
        game_domain_name: "pathofkungfu",
        game_id: 6910
    },
    installdir: join("The road of Jianghu"),
    gameName: "The road of Jianghu",
    gameExe: "daojianjianghulu.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2361680"
        },
        {
            name: "直接启动",
            exePath: join("daojianjianghulu.exe")
        }
    ],
    // archivePath: join(FileHandler.GetAppData(), "LocalLow", "BadMudStudio", "daojianjianghulu"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/mod/202409/MOD66ee9421978bf.jpg@webp",
    modType: UnityGame.modType,
    checkModType: UnityGame.checkModType
}