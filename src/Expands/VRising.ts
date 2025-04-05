/**
 * @description 夜族崛起 支持
 */

import { join } from "node:path"


export const supportedGames: ISupportedGames = {
    GlossGameId: 285,
    steamAppID: 1604030,
    Thunderstore: {
        community_identifier: 'v-rising'
    },
    nexusMods: {
        game_domain_name: "vrising",
        game_id: 4527
    },
    installdir: join("VRising"),
    gameName: "VRising",
    gameExe: "VRising.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1604030"
        },
        {
            name: "直接启动",
            exePath: join("VRising.exe")
        }
    ],
    archivePath: join(FileHandler.GetAppData(), "LocalLow", "Stunlock Studios", "VRising"),
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/632f15e51ee2c.png",
    modType: UnityGame.modType,
    checkModType: UnityGame.checkModType
}