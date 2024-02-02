/**
 * Unity 引擎 通用安装
 */

import { join, basename, extname } from "path";
import { Manager } from "@src/model/Manager";
import type { ISupportedGames, IModInfo } from "@src/model/Interfaces";
import { ElMessage } from "element-plus";

export class UnityGame {
    static modType: ISupportedGames["modType"] = [
        {
            id: 1,
            name: "BepInEx",
            installPath: join(""),
            async install(mod) {
                return Manager.installByFileSibling(mod, this.installPath ?? "", 'winhttp.dll', true)
            },
            async uninstall(mod) {
                return Manager.installByFileSibling(mod, this.installPath ?? "", 'winhttp.dll', false)
            }
        },
        {
            id: 2,
            name: "plugins",
            installPath: join("BepInEx", "plugins"),
            async install(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "plugins", true, false, true)
            },
            async uninstall(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "plugins", false, false, true)
            }
        },
        {
            id: 3,
            name: "游戏根目录",
            installPath: join(""),
            async install(mod) {
                return Manager.generalInstall(mod, this.installPath ?? "", false)
            },
            async uninstall(mod) {
                return Manager.generalUninstall(mod, this.installPath ?? "", false)
            }
        },
        {
            id: 99,
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
    ]

    static checkModType(mod: IModInfo) {
        let BepInEx = false
        let plugins = false

        mod.modFiles.forEach(item => {
            if (basename(item).toLowerCase() == 'winhttp.dll') BepInEx = true
            if (extname(item) == '.dll') plugins = true
        })

        if (BepInEx) return 1
        if (plugins) return 2

        return 99
    }
}