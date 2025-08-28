import { FileHandler } from '@/model/FileHandler'
import { basename, join } from 'path'

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
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/mod/202503/MOD67c7ff0ec9f40.webp@webp",
    modType: [
        ...UnrealEngine.modType("BlueClient", false),
        {
            id: 7,
            name: "MODkit",
            installPath: join(FileHandler.getMyDocuments(), 'inZOI', 'Mods'),
            install(mod) {
                const manager = useManager()
                let modStorage = join(manager.modStorage, mod.id.toString())
                mod.modFiles.forEach(item => {
                    if (basename(item) == 'mod_manifest.json') {
                        let jsonfilepath = join(modStorage, item)
                        let data = FileHandler.readFile(jsonfilepath)
                        let jsonData = JSON.parse(data)
                        jsonData.bEnable = true
                        FileHandler.writeFile(jsonfilepath, JSON.stringify(jsonData, null, 4))
                    }
                })
                return Manager.installByFile(mod, this.installPath ?? "", "mod_manifest.json", true, false, false)
            },
            uninstall(mod) {
                return Manager.installByFile(mod, this.installPath ?? "", "mod_manifest.json", false, false, false)

            }
        }
    ],
    checkModType(mod) {
        let MODkit = false
        mod.modFiles.forEach(item => {
            if (basename(item) == 'mod_manifest.json') MODkit = true
        })

        if (MODkit) return 7


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