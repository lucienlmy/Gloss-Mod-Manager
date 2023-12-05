/**
 * 管理相关
 */

import { existsSync, statSync } from 'node:fs'
import type { IModInfo, IState, ITag } from "@src/model/Interfaces";
import { join, dirname, basename, extname } from 'node:path'
import { FileHandler } from "@src/model/FileHandler";
import { useManager } from '@src/stores/useManager';
import { useDownload } from '@src/stores/useDownload';
import { ElMessage, ElMessageBox } from 'element-plus';


export class Manager {

    public static passFiles = ['README.md', 'manifest.json', 'icon.png']

    /**
     * 保存Mod信息
     * @param modList 列表数据
     * @param savePath 储存目录
     * @param fileName 文件名称
     */
    public static saveModInfo(modList: IModInfo[] | ITag[], savePath: string, fileName: string = "mod.json") {
        let configPath = join(savePath, fileName)
        // console.log(fileName, configPath);
        let config = JSON.stringify(JSON.parse(JSON.stringify(modList)))    // 移除它的响应式

        FileHandler.writeFile(configPath, config)

    }
    // 获取Mod信息
    public static async getModInfo(savePath: string, fileName = "mod.json"): Promise<IModInfo[] | ITag[]> {
        let configPath = join(savePath, fileName)
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
     * @param keepPath 是否保留路径
     * @returns 
     */
    public static generalInstall(mod: IModInfo, installPath: string, keepPath: boolean = false): IState[] {
        // FileHandler.writeLog(`安装mod: ${mod.modName}`)
        const manager = useManager()

        let modStorage = join(manager.modStorage, mod.id.toString())
        let gameStorage = join(manager.gameStorage ?? "", installPath)
        let res: IState[] = []
        mod.modFiles.forEach(async item => {
            try {
                // let source = `${modStorage}\\${item}`
                let source = join(modStorage, item)
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
        // FileHandler.writeLog(`卸载mod: ${mod.modName}`);
        const manager = useManager()
        let gameStorage = join(manager.gameStorage ?? "", installPath)
        let modStorage = join(manager.modStorage, mod.id.toString())

        let res: IState[] = []
        mod.modFiles.forEach(item => {
            try {
                let source = join(modStorage, item)
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
        let modId = manager.isAddedWebId(webId)
        if (modId) {
            let engine = manager.getModInfoById(modId)
            if (!(engine?.isInstalled)) {
                ElMessageBox.confirm(`该Mod需要${name}才能使用,您已添加到管理器,是否现在安装?`).then(() => {
                    engine!.isInstalled = true
                }).catch(() => { })
            }
            return true
        } else {
            ElMessageBox.confirm(`该Mod需要${name}才能使用, 是否现在下载?`).then(() => {
                const download = useDownload()
                download.addDownloadById(webId)
            }).catch(() => { })
            return false
        }
    }

    /**
     * 以某个文件夹为分割 安装/卸载 文件
     * @param mod mod
     * @param installPath 安装路径
     * @param folderName 文件夹名称 
     * @param isInstall 是否安装
     * @param include 是否包含文件夹
     * @param spare 是否保留其他文件
     * @returns 
     */
    public static async installByFolder(mod: IModInfo, installPath: string, folderName: string, isInstall: boolean, include: boolean = false, spare: boolean = false) {
        const manager = useManager()
        let res: IState[] = []
        mod.modFiles.forEach(async item => {
            try {
                if (this.passFiles.includes(basename(item))) return

                let modStorage = join(manager.modStorage ?? "", mod.id.toString(), item)
                if (statSync(modStorage).isFile()) {
                    let path = FileHandler.getFolderFromPath(modStorage, folderName, include)
                    if (path) {
                        let gameStorage = join(manager.gameStorage ?? "", installPath, path)
                        if (isInstall) {
                            let state = await FileHandler.copyFile(modStorage, gameStorage)
                            res.push({ file: item, state: state })
                        } else {
                            let state = FileHandler.deleteFile(gameStorage)
                            res.push({ file: item, state: state })
                        }
                    } else if (spare) {
                        let gameStorage = join(manager.gameStorage ?? "", installPath, item)
                        if (isInstall) {
                            let state = await FileHandler.copyFile(modStorage, gameStorage)
                            res.push({ file: item, state: state })
                        } else {
                            let state = FileHandler.deleteFile(gameStorage)
                            res.push({ file: item, state: state })
                        }
                    }
                }
            } catch (error) {
                ElMessage.error(`错误: ${error}`)
            }
        })
        return res
    }

    /**
     * 以某个文件为基础, 安装/卸载 Mod
     * @param mod mod
     * @param installPath 安装路径
     * @param fileName 文件名称
     * @param isInstall 是否是安装
     */
    public static async installByFile(mod: IModInfo, installPath: string, fileName: string, isInstall: boolean) {
        const manager = useManager()
        let modStorage = join(manager.modStorage, mod.id.toString())
        let gameStorage = join(manager.gameStorage ?? "", installPath)
        let folder: string[] = []
        mod.modFiles.forEach(item => {
            if (basename(item).toLowerCase() == fileName.toLowerCase()) {
                folder.push(dirname(join(modStorage, item)))
            }
        })

        if (folder.length > 0) {
            folder.forEach(item => {
                let target = join(gameStorage, basename(item))
                if (isInstall) {
                    FileHandler.createLink(item, target, true)
                } else {
                    FileHandler.removeLink(target, true)
                }
            })

        }
        return true
    }

    /**
     * 以某个文件为基础, 将改文件同级的所有文件安装/卸载 Mod 
     * @param mod mod
     * @param installPath 安装路径
     * @param fileName 文件名 | 拓展名
     * @param isInstall 是否是安装
     * @param isExtname 是否按拓展名匹配
     * @returns 
     */
    public static async installByFileSibling(mod: IModInfo, installPath: string, fileName: string, isInstall: boolean, isExtname: boolean = false, inGameStorage: boolean = true) {
        const manager = useManager()
        let modStorage = join(manager.modStorage, mod.id.toString())
        let gameStorage = inGameStorage ? join(manager.gameStorage ?? "", installPath) : installPath
        let folders = [] as {
            folder: string
            files: string[]
        }[]
        mod.modFiles.forEach(item => {
            if (isExtname ?
                (extname(item) === fileName) :
                (basename(item).toLowerCase() == fileName.toLowerCase())
            ) {
                // 获取所在文件夹
                let folder = join(modStorage, item)
                folder = join(folder, '..')
                folders.push({
                    folder: folder,
                    files: FileHandler.getAllFilesInFolder(folder, true, true)
                })
            }
        })

        // 通过 files 去重
        folders = folders.filter((item, index) => {
            let indexs = folders.findIndex(i => i.files.toString() == item.files.toString())
            return indexs == index
        })
        console.log(folders);

        if (folders.length > 0) {
            // 复制 folder 下的所有文件和文件夹到 gameStorage
            folders.forEach(item => {

                item.files.forEach(file => {
                    if (this.passFiles.includes(basename(file))) return

                    // 从 file 中移除 item.folder
                    let source = file;
                    file = file.replace(item.folder, '')
                    let target = join(gameStorage, file)
                    if (isInstall) {
                        FileHandler.copyFile(source, target)
                    } else {
                        FileHandler.deleteFile(target)
                    }
                })
            })
        } else {
            ElMessage.error(`未找到文件: ${fileName}, 请不要随意修改MOD类型!`)
        }
        return true
    }
}