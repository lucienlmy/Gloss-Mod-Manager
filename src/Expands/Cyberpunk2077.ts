import { FileHandler } from "@src/model/FileHandler";
import { ISupportedGames } from "@src/model/Interfaces";
import { useSettings } from "@src/stores/useSettings";
import { join, extname } from 'path'

export const supportedGames: ISupportedGames = {
    gameID: 195,
    gameName: "Cyberpunk 2077",
    gameExe: 'REDprelauncher.exe',
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/195.png",
    modType: [
        {
            id: 1,
            name: 'archive',
            installPath: '\\archive\\pc\\mod',
            async install(mod) {
                return true
            },
            async uninstall(mod) {
                return true
            }
        },
        {
            id: 2,
            name: '脚本',
            installPath: '\\bin\\x64\\plugins\\cyber_engine_tweaks\\mods',
            async install(mod) {
                return true
            },
            async uninstall(mod) {
                return true
            }
        },
        {
            id: 3,
            name: 'CET',
            installPath: '\\',
            async install(mod) {
                const settings = useSettings()
                let modStorage = join(settings.settings.modStorageLocation, settings.settings.modStorageLocation, mod.id.toString())
                let gameStorage = `${settings.settings.managerGame.gamePath}\\${this.installPath}`
                mod.modFiles.forEach(item => {
                    let file = join(modStorage, item)
                    let target = join(gameStorage, item)
                    console.log(file, target);
                    FileHandler.copyFile(file, target)
                })
                FileHandler.copyFolder(modStorage, gameStorage)
                return true
            },
            async uninstall(mod) {
                return true
            }
        }
    ],
    checkModType(mod) {
        let type = 0
        mod.modFiles.forEach(item => {
            // 是否有archive文件
            let exe = extname(item)
            if (exe == ".archive") {
                type = 1
            }
        })

        if (type == 1) {
            return 1
        }

        if (mod.md5 == "9729110ccd52bed08dca225d8437b2cb") {
            return 3
        }

        return 2
    }
}