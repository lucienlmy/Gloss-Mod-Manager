
import { join } from 'path'
export const supportedGames: ISupportedGames = {
    GlossGameId: 421,
    steamAppID: 2456740,
    nexusMods: {
        game_domain_name: "inzoi",
        game_id: 7480
    },
    installdir: join("inZOI"),
    gameName: "inZOI",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2456740"
        },
        {
            name: "直接启动",
            exePath: "inZOI.exe"
        }
    ],
    gameExe: "inZOI.exe",
    gameCoverImg: "https://mod.3dmgame.com/static/upload/mod/202503/MOD67c7ff0ec9f40.webp@webp",
    modType: UnrealEngine.modType("BlueClient", false),
    checkModType(mod) {
        let typeId = UnrealEngine.checkModType(mod)

        let mainFolder = false
        if (typeId == 99) {
            const folderList = ['BlueClient']

            mod.modFiles.forEach(item => {
                let list = FileHandler.pathToArray(item)
                if (list.some(item => folderList.includes(item))) mainFolder = true
            })

            if (mainFolder) typeId = 6
        }

        return typeId
    },
}