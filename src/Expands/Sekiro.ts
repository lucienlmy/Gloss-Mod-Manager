/**
 * @description 只狼 安装支持
 */

import type { IModInfo, IState, ISupportedGames } from "@src/model/Interfaces";
import { useSettings } from "@src/stores/useSettings";
import axios from "axios";
import { basename } from 'node:path'
import { FileHandler } from "@src/model/FileHandler"
import { statSync } from "fs";
import { Manager } from "@src/model/Manager"
import { useManager } from "@src/stores/useManager";
import { ElMessageBox, ElMessage } from "element-plus";
import { useDownload } from "@src/stores/useDownload";


async function handleMod(mod: IModInfo, installPath: string, isInstall: boolean) {
    try {
        if (isInstall) {
            const manager = useManager()
            if (!manager.isAdded("e33023c54137fa25c489a442789843b1")) {
                ElMessageBox.confirm("您还没有添加ModEngine, 是否现在下载?").then(() => {
                    const download = useDownload()
                    download.addDownloadById(71282)
                }).catch(() => { })
                return false
            }
            let engine = manager.getModInfoByMd5("e33023c54137fa25c489a442789843b1")
            if (!(engine?.isInstalled)) {
                ElMessageBox.confirm("该Mod需要ModEngine才能使用,您已添加到管理器,是否现在安装?").then(() => {
                    engine!.isInstalled = true
                }).catch(() => { })
            }
        }

        let SekiroDictionary = (await axios.get("/res/SekiroDictionary.txt")).data
        let list: string[] = SekiroDictionary.split("\r\n")
        const settings = useSettings()
        let res: IState[] = []
        mod.modFiles.forEach(file => {
            let modStorage = `${settings.settings.modStorageLocation}\\${settings.settings.managerGame.gameEnName}\\${mod.id}\\${file}`
            // 判断是否是文件
            if (!statSync(modStorage).isFile()) return

            let name = basename(file)
            // 判断name 是否在list中
            if (list.some(item => item.includes(name))) {
                // 获取对应的目录
                let path = list.find(item => item.includes(name))
                let gameStorage = `${settings.settings.managerGame.gamePath}\\${installPath}\\${path}`
                if (isInstall) {
                    let state = FileHandler.copyFile(modStorage, gameStorage)
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



let supportedGames: ISupportedGames = {
    gameID: 185,
    gameName: "只狼",
    gameEnName: "Sekiro",
    gameExe: 'sekiro.exe',
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/185.png",
    corePlugins: [
        {
            id: 1,
            name: "Mod Engine",
            version: "0.1.16",
            website: "https://www.nexusmods.com/sekiro/mods/6",
            installPath: "\\",
            md5: ["e33023c54137fa25c489a442789843b1"]
        }
    ],
    modType: [
        {
            id: 1,
            name: '基础类型',
            installPath: '\\mods',
            install(mod) {
                return handleMod(mod, this.installPath ?? "", true)
            },
            uninstall(mod) {
                return handleMod(mod, this.installPath ?? "", false)
            },
        },
        {
            id: 2,
            name: 'ModEngine',
            installPath: "",
            async install(mod) {
                Manager.generalInstall(mod, this.installPath ?? "")
                return true
            },
            async uninstall(mod) {
                Manager.generalUninstall(mod, this.installPath ?? "")
                return true
            },
        }
    ],
    checkModType(mod) {
        let md5s = this.corePlugins?.find(p => p.id === 1)?.md5 ?? []
        if (md5s.includes(mod.md5)) {
            return 2
        }
        return 1
    }
}

export default supportedGames