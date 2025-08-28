/**
 * @description 鬼泣5 支持
 */

import { join, extname, basename } from 'path'
import { ElMessage } from "element-plus";


export const supportedGames: ISupportedGames = {
    GlossGameId: 183,
    steamAppID: 601150,
    nexusMods: {
        game_id: 2751,
        game_domain_name: "devilmaycry5",
    },
    installdir: "Devil May Cry 5",
    gameName: "Devil May Cry 5",
    gameExe: 'DevilMayCry5.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/601150'
        },
        {
            name: '直接启动',
            exePath: 'DevilMayCry5.exe'
        }
    ],
    archivePath: (() => {
        let steamPath = Steam.getSteamInstallPath()
        if (steamPath) {
            return join(steamPath, 'userdata', Steam.GetLastSteamId32(), '601150', 'remote')
        } else {
            return join(FileHandler.GetAppData(), "Local", "SKIDROW", "220440", "Storage")
        }
    })(),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/183.jpg",
    modType: REEngine.modType,
    checkModType: REEngine.checkModType
}