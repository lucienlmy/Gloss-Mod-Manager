/**
 * @description 怪物猎人 荒野 支持
 */

import { join } from 'path'

export const supportedGames: ISupportedGames = {
    GlossGameId: 420,
    steamAppID: 2246340,
    nexusMods: {
        game_domain_name: "monsterhunterwilds",
        game_id: 6993
    },
    installdir: "MonsterHunterWilds",
    gameName: "Monster Hunter Wilds",
    gameExe: 'MonsterHunterWilds.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/2246340'
        },
        {
            name: '直接启动',
            exePath: 'MonsterHunterWilds'
        }
    ],
    archivePath: join(Steam.getSteamInstallPath() || "", "userdata", Steam.GetLastSteamId32(), "2246340", "remote"),
    gameCoverImg: "https://mod.3dmgame.com/static/upload/mod/202502/MOD67beca9449633.webp@webp",
    modType: REEngine.modType,
    checkModType: REEngine.checkModType,
}