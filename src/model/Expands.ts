/**
 * 拓展
 */

import { join, extname, basename } from "path";
import { Config } from "@src/model/Config";
import { FileHandler } from "@src/model/FileHandler";
import { useManager } from "@src/stores/useManager";
import type { IModInfo, ISupportedGames, IType, ITypeInstall, ICheckModType } from "@src/model/Interfaces";
import { Manager } from "@src/model/Manager";
import { ElMessage } from "element-plus";

export class Expands {

    /**
     * 初始化拓展
     */
    public static init() {
        this.getExpandsList()
    }

    public static expandsFolder() {
        return join(Config.configFolder(), 'Expands')
    }

    public static getExpandsList() {
        const expandsFolder = this.expandsFolder()
        FileHandler.createDirectory(expandsFolder)
        const files = FileHandler.getAllFilesInFolder(expandsFolder, true)
        const folders = FileHandler.getAllFolderInFolder(expandsFolder, true)
        // console.log(folders);

        const manager = useManager()

        // ts 实现游戏拓展
        folders.forEach(item => {
            let index = join(item, 'index.js')
            // 判断文件是否存在
            if (FileHandler.fileExists(index)) {
                let { supportedGames } = require(index)
                // console.log(supportedGames);
                manager.supportedGames.push(supportedGames)
            }
        })

        // json 实现游戏拓展
        files.forEach(item => {
            if (extname(item) == '.json') {
                let data: ISupportedGames = JSON.parse(FileHandler.readFile(item))
                data = Expands.JsonToSupportedGamesData(data)
                manager.supportedGames.push(data)
            }
        })
    }

    // json 数据转可执行方法
    public static JsonToSupportedGamesData(data: ISupportedGames): ISupportedGames {
        data.modType.forEach(item => {
            if (typeof (item.install) == 'object') {
                console.log(typeof (item.install));
                let install = item.install
                item.install = async (mod) => {
                    return Expands.typeToFunction(install, mod, item)
                }
            }
            if (typeof (item.uninstall) == 'object') {
                let uninstall = item.uninstall
                item.uninstall = async (mod) => {
                    return Expands.typeToFunction(uninstall, mod, item)
                }
            }
        })

        if (typeof (data.checkModType) == 'object') {
            let checkModType = data.checkModType as ICheckModType[]
            data.checkModType = (mod) => {
                for (let i in mod.modFiles) {
                    let file = mod.modFiles[i]
                    for (let index in checkModType) {
                        let item = checkModType[index]
                        switch (item.UseFunction) {
                            case "extname":
                                if (item.Keyword.includes(extname(file))) return item.TypeId
                            case "basename":
                                if (item.Keyword.includes(basename(file))) return item.TypeId
                            case "inPath":
                                let list = FileHandler.pathToArray(file)
                                if (item.Keyword.every(key => list.includes(key))) return item.TypeId
                        }
                    }
                }
                return 99
            }
        }

        // console.log(data.modType);
        return data
    }

    // 解析 类型
    public static typeToFunction(install: ITypeInstall, mod: IModInfo, item: IType) {
        // let install = item.install as ITypeInstall
        // console.log(install);

        switch (install.UseFunction) {
            case "generalInstall":
                return Manager.generalInstall(mod, item.installPath ?? "", install.keepPath)
            case "generalUninstall":
                return Manager.generalUninstall(mod, item.installPath ?? "", install.keepPath)
            case "installByFile":
                return Manager.installByFile(
                    mod,
                    item.installPath ?? "",
                    install.fileName ?? "",
                    install.isInstall ?? true,
                    install.isExtname,
                    install.inGameStorage)
            case "installByFileSibling":
                return Manager.installByFileSibling(
                    mod,
                    item.installPath ?? "",
                    install.fileName ?? "",
                    install.isInstall ?? true,
                    install.isExtname,
                    install.inGameStorage,
                    install.pass)
            case "installByFolder":
                return Manager.installByFolder(
                    mod,
                    item.installPath ?? "",
                    install.folderName ?? "",
                    install.isInstall ?? true,
                    install.include,
                    install.spare)
            case "installByFolderParent":
                return Manager.installByFolderParent(
                    mod,
                    item.installPath ?? "",
                    install.folderName ?? "",
                    install.isInstall ?? true,
                    install.inGameStorage)
            case "Unknown":
                ElMessage.warning("未知类型, 请手动安装")
        }

        return false
    }
}

