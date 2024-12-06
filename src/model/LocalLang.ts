import path from 'path'

import fs from 'fs'
export class LocalLang {
    public static langFolder = path.join(Config.configFolder(), 'lang')

    public static init() {

        if (!fs.existsSync(this.langFolder)) { return }

        const settings = useSettings()
        this.getLocalLangList().then(list => {
            settings.langList.push(...list)
        })
    }

    private static async getLocalLangList() {
        let list = await FileHandler.readFileSync(path.join(this.langFolder, 'lang.json'), '[]')
        let langList = JSON.parse(list)

        langList.forEach((item: any) => {
            item.text += "_local";
            item.value += "_local";
        })
        return langList
    }

    public static getLocalLangData(data: any) {
        if (!fs.existsSync(this.langFolder)) { return }

        // 获取目录中所有文件列表
        let list = FileHandler.getAllFiles(this.langFolder)
        console.log(list);

        // 移除文件名是 lang.json 的文件
        list = list.filter(fileName => !fileName.includes("lang.json"));
        // let data: any = {}
        list?.forEach(async item => {
            let name = path.basename(item, '.json')
            let list = FileHandler.readFile(item)
            data[`${name}_local`] = JSON.parse(list ?? "{}")
        })
    }

}