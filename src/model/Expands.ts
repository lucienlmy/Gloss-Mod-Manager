/**
 * 拓展
 */

import { join } from "path";
import { Config } from "@src/model/Config";
import { FileHandler } from "@src/model/FileHandler";
import { useManager } from "@src/stores/useManager";

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
        const Folders = FileHandler.getAllFolderInFolder(expandsFolder);

        const manager = useManager()

        for (let i in Folders) {
            const item = Folders[i];

            let index = join(item, 'index.js')

            // 判断文件是否存在
            if (FileHandler.fileExists(index)) {
                let { supportedGames } = require(index)
                // console.log(supportedGames);
                manager.supportedGames.push(supportedGames)
            }
        }
    }
}