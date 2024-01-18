/**
 * 拓展
 */

import { join } from "path";
import { Config } from "@src/model/Config";
import { FileHandler } from "@src/model/FileHandler";

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

        for (let i in Folders) {
            const item = Folders[i];
            const info = JSON.parse(FileHandler.readFile(join(item, 'info.json'), '{}'))

            console.log(info);

        }


    }

}