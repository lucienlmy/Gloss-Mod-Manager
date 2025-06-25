/**
 * 类型拓展
 */

import { join, extname, basename } from "path";

export class ExpandsType {
    public static expandsFolder() {
        return join(Config.configFolder(), 'Types')
    }

    public static async saveExpandsType(data: IExpandsType) {
        const settings = useSettings()
        const gameName = settings.settings.managerGame?.gameName
        if (gameName) {
            const file = join(this.expandsFolder(), gameName + '.json')
            let oldData: IExpandsType[] = []
            if (FileHandler.fileExists(file)) {
                // 如果存在旧数据
                oldData = JSON.parse(FileHandler.readFile(file))
            }

            // 通过名称判断是否已存在
            // 如果已存在则将新的替换为旧的
            if (oldData.some(item => item.name === data.name)) {
                oldData = oldData.map(item => item.name === data.name ? data : item);
            } else {
                oldData.push(data);
            }
            await FileHandler.writeFile(file, JSON.stringify(oldData, null, 4))
        }
    }
    public static async removeExpandsType(data: IExpandsType) {
        const settings = useSettings()
        const gameName = settings.settings.managerGame?.gameName
        if (gameName) {
            const file = join(this.expandsFolder(), gameName + '.json')
            if (FileHandler.fileExists(file)) {
                // 读取现有数据
                let oldData: IExpandsType[] = JSON.parse(FileHandler.readFile(file))

                // 过滤掉要删除的拓展类型
                oldData = oldData.filter(item => item.name !== data.name)

                // 重新写入文件
                await FileHandler.writeFile(file, JSON.stringify(oldData, null, 4))
                return true
            }
        }
        return false
    }

    public static getExpandsTypeList(gameName: string) {
        const file = join(this.expandsFolder(), gameName + '.json')
        if (FileHandler.fileExists(file)) {
            const data: IExpandsType[] = JSON.parse(FileHandler.readFile(file))
            data.forEach(item => {
                item.id = `ex-${item.name}`;
                if (typeof (item.install) === 'object') {
                    let install = item.install
                    item.install = async (mod) => {
                        return Expands.typeToFunction(install, mod, item.installPath)
                    }
                }
                if (typeof (item.uninstall) === 'object') {
                    let uninstall = item.uninstall
                    item.uninstall = async (mod) => {
                        return Expands.typeToFunction(uninstall, mod, item.installPath)
                    }
                }
            })
            return data as IType[]
        } else {
            return []
        }
    }

    public static checkModType(gameName: string, modFiles: string[]) {
        const file = join(this.expandsFolder(), gameName + '.json')
        if (FileHandler.fileExists(file)) {
            const data: IExpandsType[] = JSON.parse(FileHandler.readFile(file))

            console.log(data);


            for (let index in data) {
                let item = data[index]

                for (let i in modFiles) {
                    let modFile = modFiles[i]

                    switch (item.checkModType.UseFunction) {
                        case "extname":
                            if (item.checkModType.Keyword.includes(extname(modFile))) return `ex-${item.name}`
                        case "basename":
                            if (item.checkModType.Keyword.includes(basename(modFile))) return `ex-${item.name}`
                        case "inPath":
                            let list = FileHandler.pathToArray(modFile)
                            if (item.checkModType.Keyword.every(key => list.includes(key))) return `ex-${item.name}`
                    }
                }

            }
        } else {
            return undefined
        }
    }
}