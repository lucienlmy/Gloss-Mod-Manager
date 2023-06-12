/**
 * 管理相关
 */

import { existsSync, statSync } from 'node:fs'
import type { IModInfo, IState } from "@src/model/Interfaces";
import { join } from 'node:path'
import { FileHandler } from "@src/model/FileHandler";
import { useSettings } from "@src/stores/useSettings";
import { basename } from 'node:path'
import { useManager } from '@src/stores/useManager';
import { useDownload } from '@src/stores/useDownload';
import { ElMessageBox } from 'element-plus';


export class Manager {

    // 保存Mod信息
    public static saveModInfo(modList: IModInfo[], savePath: string) {
        let configPath = join(savePath, 'mod.json')
        let config = JSON.stringify(JSON.parse(JSON.stringify(modList)))    // 移除它的响应式

        FileHandler.writeFile(configPath, config)

    }
    // 获取Mod信息
    public static async getModInfo(savePath: string): Promise<IModInfo[]> {
        let configPath = join(savePath, 'mod.json')
        FileHandler.createDirectory(savePath)   // 创建目录
        let config = await FileHandler.readFileSync(configPath, "[]")  // 读取文件
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

    /**
     * 一般安装 (复制文件到指定目录)
     * @param mod 
     * @param installPath 安装路径
     * @param ignoredFolders 是否忽略文件夹
     * @param keepPath 是否保留路径
     * @returns 
     */
    public static generalInstall(mod: IModInfo, installPath: string, keepPath: boolean = false): IState[] {
        FileHandler.writeLog(`安装mod: ${mod.modName}`)
        const manager = useManager()

        let modStorage = join(manager.modStorage, mod.id.toString())
        let gameStorage = join(manager.gameStorage ?? "", installPath)
        let res: IState[] = []
        mod.modFiles.forEach(async item => {
            try {
                let source = `${modStorage}\\${item}`
                if (statSync(source).isFile()) {
                    let target = keepPath ? join(gameStorage, item) : join(gameStorage, basename(item))
                    let state = await FileHandler.copyFile(source, target)
                    res.push({ file: item, state: state })
                }
            } catch (error) {
                res.push({ file: item, state: false })
            }
        })
        return res
    }

    // 一般卸载
    public static generalUninstall(mod: IModInfo, installPath: string, keepPath: boolean = false): IState[] {
        FileHandler.writeLog(`卸载mod: ${mod.modName}`);
        const manager = useManager()
        let gameStorage = join(manager.gameStorage ?? "", installPath)
        let modStorage = join(manager.modStorage, mod.id.toString())

        let res: IState[] = []
        mod.modFiles.forEach(item => {
            try {
                let source = `${modStorage}\\${item}`
                if (statSync(source).isFile()) {
                    // console.log("source:", source);
                    let target = keepPath ? join(gameStorage, item) : join(gameStorage, basename(item))
                    let state = FileHandler.deleteFile(target)
                    res.push({ file: item, state: state })
                }
            } catch (error) {
                res.push({ file: item, state: false })
            }
        })
        return res
    }

    // 检查插件是否已经安装
    public static checkInstalled(name: string, webId: number) {
        const manager = useManager()
        if (!manager.isAddedId(webId)) {
            ElMessageBox.confirm(`您还没有添加${name}, 是否现在下载?`).then(() => {
                const download = useDownload()
                download.addDownloadById(webId)
            }).catch(() => { })
            return false
        }
        let engine = manager.getModInfoById(webId)
        if (!(engine?.isInstalled)) {
            ElMessageBox.confirm(`该Mod需要${name}才能使用,您已添加到管理器,是否现在安装?`).then(() => {
                engine!.isInstalled = true
            }).catch(() => { })
        }
        return true
    }
}