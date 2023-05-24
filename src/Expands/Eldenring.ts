/** 
 * @description 艾尔登法环 支持
*/
import { FileHandler } from "@src/model/FileHandler";
import { IModInfo, IState, ISupportedGames } from "@src/model/Interfaces";
import { Manager } from "@src/model/Manager";
import { useDownload } from "@src/stores/useDownload";
import { useManager } from "@src/stores/useManager";
import { useSettings } from "@src/stores/useSettings";
import axios from "axios";
import { ElMessage } from "element-plus";
import { statSync } from "fs";
import { basename, join } from "path";

let dictionaryList: string[] = []

async function handleMod(mod: IModInfo, installPath: string, isInstall: boolean) {
    try {
        if (isInstall) {
            if (!Manager.checkInstalled("0c11492c30c5a080d7417ba01729f350", "ModEngine2", 197418)) return false
        }

        if (dictionaryList.length == 0) {
            let EldenRingDictionary = (await axios.get("res/EldenRingDictionary.txt")).data
            dictionaryList = EldenRingDictionary.split("\r\n")
        }

        const manager = useManager()
        let res: IState[] = []
        mod.modFiles.forEach(async file => {
            try {
                let modStorage = join(manager.modStorage ?? "", mod.id.toString(), file)
                // 判断是否是文件
                if (!statSync(modStorage).isFile()) return

                let name = basename(file)
                // 判断name 是否在list中
                if (dictionaryList.some(item => item.includes(name))) {
                    // 获取对应的目录
                    let path = dictionaryList.find(item => item.includes(name))
                    let gameStorage = join(manager.gameStorage ?? "", installPath, path ?? "")
                    if (isInstall) {
                        let state = await FileHandler.copyFile(modStorage, gameStorage)
                        res.push({ file: file, state: state })
                    } else {
                        let state = FileHandler.deleteFile(gameStorage)
                        res.push({ file: file, state: state })
                    }
                }
            } catch (error) {
                res.push({ file: file, state: false })
            }
        })
        return res
    } catch (error) {
        ElMessage.error(`错误:${error}`)
        return false
    }
}

export const supportedGames: ISupportedGames = {
    gameID: 275,
    gameName: "ELDEN RING",
    gameExe: 'eldenring.exe',
    startExe: "modengine2_launcher.exe",
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/620b6924d8c0d.png",
    modType: [
        {
            id: 1,
            name: '通用类型',
            installPath: '\\mods',
            async install(mod) {
                return handleMod(mod, this.installPath ?? '', true)
            },
            async uninstall(mod) {
                return handleMod(mod, this.installPath ?? '', false)
            }
        },
        {
            id: 2,
            name: 'Engine 2',
            installPath: "\\",
            async install(mod) {
                // const manager = useManager()
                // let modStorage = join(manager.modStorage ?? "", mod.id.toString())
                // if (manager.gameStorage) {
                //     FileHandler.copyFolder(modStorage, manager.gameStorage).then(async () => {
                //         // await FileHandler.renameFile(
                //         //     join(manager.gameStorage ?? "", "start_protected_game.exe"),
                //         //     join(manager.gameStorage ?? "", "start_protected_game.exe.back")
                //         // )
                //         // await FileHandler.renameFile(
                //         //     join(manager.gameStorage ?? "", "modengine2_launcher.exe"),
                //         //     join(manager.gameStorage ?? "", "start_protected_game.exe")
                //         // )
                //     })
                //     return true
                // }
                // return false
                return Manager.generalInstall(mod, this.installPath ?? "", true)
            },
            async uninstall(mod) {
                // const manager = useManager()
                // FileHandler.deleteFolder(join(manager.gameStorage ?? "", "modengine2"))
                // let fileList = [
                //     "config_darksouls3.toml",
                //     "config_eldenring.toml",
                //     "launchmod_darksouls3.bat",
                //     "launchmod_eldenring.bat",
                //     "start_protected_game.exe",
                //     "README.txt",
                //     "mod_loader_config.ini",
                //     "dinput8.dll",
                // ]

                // fileList.forEach(file => {
                //     FileHandler.deleteFile(join(manager.gameStorage ?? "", file))
                // })

                // FileHandler.renameFile(
                //     join(manager.gameStorage ?? "", "start_protected_game.exe.back"),
                //     join(manager.gameStorage ?? "", "start_protected_game.exe")
                // )
                // return true
                return Manager.generalUninstall(mod, this.installPath ?? "", true)

            },
        }
    ],
    checkModType(mod) {
        let md5 = '0c11492c30c5a080d7417ba01729f350'
        if (mod.md5 == md5) {
            return 2
        }
        return 1
    }
}
