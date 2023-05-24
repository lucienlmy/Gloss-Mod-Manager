import { FileHandler } from "@src/model/FileHandler";
import { IModInfo, IState, ISupportedGames } from "@src/model/Interfaces";
import { useManager } from "@src/stores/useManager";
import { join, extname, sep, basename, dirname } from 'path'
import { statSync } from "fs";
import { Manager } from "@src/model/Manager";
import { ElMessage } from "element-plus";

function handlePlugins(mod: IModInfo, installPath: string, isInstall: boolean) {
    if (isInstall) if (!Manager.checkInstalled("1000b735b627b50048a4b598cd9e6f7c", "SMAPI", 197894)) return false
    let res: IState[] = []
    const manager = useManager()
    let modStorage = join(manager.modStorage, mod.id.toString())
    let gameStorage = join(manager.gameStorage ?? "", installPath)
    let folder = ""
    mod.modFiles.forEach(item => {
        if (basename(item) == "manifest.json") {
            folder = dirname(join(modStorage, item))
        }
    })
    // console.log(folder);
    if (folder != "") {
        let target = join(gameStorage, basename(folder))
        if (isInstall) {
            FileHandler.copyFolder(folder, target)
        } else {
            FileHandler.deleteFolder(target)
        }
    }

    return res
}

export const supportedGames: ISupportedGames = {
    gameID: 10,
    gameName: "Stardew Valley",
    gameExe: 'Stardew Valley.exe',
    startExe: "StardewModdingAPI.exe",
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/10.jpg",
    modType: [
        {
            id: 1,
            name: "SMAPI",
            installPath: "",
            async install(mod) {
                return Manager.generalInstall(mod, this.installPath ?? "", true)
            },
            async uninstall(mod) {
                return Manager.generalUninstall(mod, this.installPath ?? "", true)
            }
        },
        {
            id: 2,
            name: "通用",
            installPath: "Mods",
            async install(mod) {
                return handlePlugins(mod, this.installPath ?? "", true)
            },
            async uninstall(mod) {
                return handlePlugins(mod, this.installPath ?? "", false)
            }
        },
        {
            id: 3,
            name: "未知",
            installPath: "",
            async install(mod) {
                ElMessage.warning("未知类型, 请手动安装")
                return false
            },
            async uninstall(mod) {
                return true
            }
        }
    ],
    checkModType(mod) {

        if (mod.md5 == "1000b735b627b50048a4b598cd9e6f7c") return 1

        let plugins = false
        // manifest.json
        mod.modFiles.forEach(item => {
            if (basename(item) == "manifest.json") plugins = true
        })

        if (plugins) return 2

        return 3
    }
}