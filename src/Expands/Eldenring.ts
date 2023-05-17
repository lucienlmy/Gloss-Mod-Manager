/** 
 * @description 艾尔登法环 支持
*/
import { FileHandler } from "@src/model/FileHandler";
import { IModInfo, IState, ISupportedGames } from "@src/model/Interfaces";
import { useDownload } from "@src/stores/useDownload";
import { useManager } from "@src/stores/useManager";
import { useSettings } from "@src/stores/useSettings";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import { statSync } from "fs";
import { basename } from "path";

async function handleMod(mod: IModInfo, installPath: string, isInstall: boolean) {
    try {
        if (isInstall) {
            const manager = useManager()
            if (!manager.isAdded("9daf6d77bbcfd1293812be71fa24a1da")) {
                ElMessageBox.confirm("您还没有添加ModEngine2, 是否现在下载?").then(() => {
                    const download = useDownload()
                    download.addDownloadById(197418)
                }).catch(() => { })
                return false
            }
            let engine = manager.getModInfoByMd5("9daf6d77bbcfd1293812be71fa24a1da")
            if (!(engine?.isInstalled)) {
                ElMessageBox.confirm("该Mod需要ModEngine2才能使用,您已添加到管理器,是否现在安装?").then(() => {
                    engine!.isInstalled = true
                }).catch(() => { })
            }
        }

        let SekiroDictionary = (await axios.get("/res/EldenRingDictionary.txt")).data
        let list: string[] = SekiroDictionary.split("\r\n")
        const settings = useSettings()
        let res: IState[] = []
        mod.modFiles.forEach(async file => {
            let modStorage = `${settings.settings.modStorageLocation}\\${settings.settings.managerGame.gameName}\\${mod.id}\\${file}`
            // 判断是否是文件
            if (!statSync(modStorage).isFile()) return

            let name = basename(file)
            // 判断name 是否在list中
            if (list.some(item => item.includes(name))) {
                // 获取对应的目录
                let path = list.find(item => item.includes(name))
                let gameStorage = `${settings.settings.managerGame.gamePath}\\${installPath}\\${path}`
                if (isInstall) {
                    let state = await FileHandler.copyFile(modStorage, gameStorage)
                    res.push({ file: file, state: state })
                } else {
                    let state = FileHandler.deleteFile(gameStorage)
                    res.push({ file: file, state: state })
                }
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
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/620b6924d8c0d.png",
    modType: [
        {
            id: 1,
            name: '通用类型',
            installPath: '\\mod',
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
                const manager = useManager()
                let modStorage = `${manager.modStorage}\\${mod.id}`
                if (manager.gameStorage) {
                    FileHandler.copyFolder(modStorage, manager.gameStorage).then(async () => {
                        await FileHandler.renameFile(`${manager.gameStorage}\\start_protected_game.exe`, `${manager.gameStorage}\\start_protected_game.exe.back`)
                        await FileHandler.renameFile(`${manager.gameStorage}\\modengine2_launcher.exe`, `${manager.gameStorage}\\start_protected_game.exe`)
                    })
                    return true
                }
                return false
            },
            async uninstall(mod) {
                const manager = useManager()
                FileHandler.deleteFolder(`${manager.gameStorage}\\modengine2`)
                let fileList = [
                    "config_darksouls3.toml",
                    "config_eldenring.toml",
                    "launchmod_darksouls3.bat",
                    "launchmod_eldenring.bat",
                    "start_protected_game.exe",
                    "README.txt",
                ]

                fileList.forEach(file => {
                    FileHandler.deleteFile(`${manager.gameStorage}\\${file}`)
                })

                FileHandler.renameFile(`${manager.gameStorage}\\start_protected_game.exe.back`, `${manager.gameStorage}\\start_protected_game.exe`)


                return true
            },
        }
    ],
    checkModType(mod) {
        let md5 = '9daf6d77bbcfd1293812be71fa24a1da'
        if (mod.md5 == md5) {
            return 2
        }
        return 1
    }
}
