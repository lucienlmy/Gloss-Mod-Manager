/**
 * 管理相关
 */

import { existsSync, statSync } from 'node:fs'
import type { IModInfo, IState } from "@src/model/Interfaces";
import { join } from 'node:path'
import { FileHandler } from "@src/model/FileHandler";
import { useSettings } from "@src/stores/useSettings";
import { basename } from 'node:path'


export class Manager {

    // 保存Mod信息
    public static saveModInfo(modList: IModInfo[], savePath: string) {
        let configPath = join(savePath, 'mod.json')
        let config = JSON.stringify(JSON.parse(JSON.stringify(modList)))    // 移除它的响应式

        FileHandler.writeFile(configPath, config)

    }
    // 获取Mod信息
    public static getModInfo(savePath: string): IModInfo[] {
        let configPath = join(savePath, 'mod.json')
        FileHandler.createDirectory(savePath)   // 创建目录
        let config = FileHandler.readFile(configPath, "[]")  // 读取文件
        let modList: IModInfo[] = JSON.parse(config)    // 转换为对象
        return modList
    }

    // 删除Mod文件
    public static deleteMod(folderPath: string) {
        if (!existsSync(folderPath)) {
            return;
        }
        FileHandler.deleteFolder(folderPath)

    }

    // 一般安装
    public static generalInstall(mod: IModInfo, installPath: string, ignoredFolders: boolean = false): IState[] {
        FileHandler.writeLog(`安装mod: ${mod.modName}`)
        // console.log(mod.modFiles);
        const settings = useSettings()
        // console.log(settings.settings.managerGame);
        let modStorage = `${settings.settings.modStorageLocation}\\${settings.settings.managerGame.gameEnName}\\${mod.id}`
        let gameStorage = `${settings.settings.managerGame.gamePath}\\${installPath}`
        let res: IState[] = []
        mod.modFiles.forEach(file => {
            let source = `${modStorage}\\${file}`
            if (ignoredFolders) {
                if (statSync(source).isDirectory()) {
                    return
                }
            }
            let target = `${gameStorage}\\${basename(file)}`
            let state = FileHandler.copyFile(source, target)
            res.push({ file: file, state: state })

        })
        return res
    }

    // 一般卸载
    public static generalUninstall(mod: IModInfo, installPath: string, ignoredFolders: boolean = false): IState[] {
        FileHandler.writeLog(`卸载mod: ${mod.modName}`);
        const settings = useSettings()
        let gameStorage = `${settings.settings.managerGame.gamePath}\\${installPath}`
        let res: IState[] = []
        mod.modFiles.forEach(file => {
            let target = `${gameStorage}\\${basename(file)}`
            let state = FileHandler.deleteFile(target)
            res.push({ file: file, state: state })
        })
        return res
    }
}