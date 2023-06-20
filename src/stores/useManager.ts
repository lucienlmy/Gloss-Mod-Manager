import { defineStore } from "pinia";
import path from 'path'
import { getAllExpands } from "@src/Expands";
import type { ISupportedGames, IModInfo, IDownloadTask } from "@src/model/Interfaces";
import { ipcRenderer } from "electron";
import { ElMessage } from "element-plus";
import { useSettings } from '@src/stores/useSettings';
import { Manager } from "@src/model/Manager";
import { FileHandler } from "@src/model/FileHandler"
import { Unzipper } from '@src/model/Unzipper'

export const useManager = defineStore('Manager', {
    state: () => ({
        supportedGames: getAllExpands() as ISupportedGames[],
        managerModList: [] as IModInfo[],
        selectGameDialog: false,
        maxID: 0,
        filterType: 0 as number,
        search: "",
        packDialog: false,
        packInfo: {} as IModInfo
    }),
    getters: {
        /**
         * Mod存储路径
         * @returns 
         */
        modStorage() {
            const settings = useSettings()
            return path.join(settings.settings.modStorageLocation, settings.settings.managerGame.gameName)
        },
        /**
        * 游戏路径
        * @returns 
        */
        gameStorage() {
            const settings = useSettings()
            return settings.settings.managerGame.gamePath
        },
        filterModList(state) {
            if (state.filterType == 0) return state.managerModList.filter((item) => item.modName.indexOf(state.search) != -1)
            return state.managerModList.filter(item => item.modType == state.filterType && item.modName.indexOf(state.search) != -1)
        }
    },
    actions: {
        // 选择Mod文件
        selectMoeFiles() {
            ipcRenderer.invoke("select-file", {
                properties: ['openFile', 'multiSelections'],
                filters: [
                    { name: 'Zip Files', extensions: ['zip', 'rar', '7z', 'gmm'] },
                ]
            }).then((res: string[]) => {
                if (res.length > 0) {
                    res.forEach(async file => {
                        await this.addModFile(file)
                    });
                }
            })
        },
        // 通过md5 判断是否已经添加
        isAdded(md5: string) {
            let is = false
            this.managerModList.forEach(item => {
                if (item.md5 == md5) {
                    is = true
                }
            })

            return is
        },
        // 通过id 判断是否已经添加
        isAddedId(id: number) {
            let is = false;
            this.managerModList.forEach(item => {
                if (item.id == id) is = true
            })

            return is
        },
        isAddedWebId(id: number) {
            let modId = null as null | number;
            this.managerModList.forEach(item => {
                if (item.webId == id) modId = item.id
            })
            return modId
        },
        // 将选中的Mod文件添加到管理器
        async addModFile(file: string) {

            if (path.extname(file) == '.gmm') {
                return this.addModByGmm(file)
            }

            const settings = useSettings()
            const allowedExtensions = ['.zip', '.rar', '.7z', '.gmm'];

            if (!allowedExtensions.some(ext => file.endsWith(ext))) {
                ElMessage.error('不支持的文件类型')
                return
            }

            if (settings.settings.modStorageLocation == '') {
                ElMessage.error('请先选择Mod存放位置')
                return
            }

            this.maxID++
            let id = this.maxID.toString()
            console.log(id);

            let md5 = await FileHandler.getFileMd5(file)

            // 检查是否已经添加
            if (this.isAdded(md5)) {
                ElMessage.error(`您已经添加过『${path.basename(file)}』这款Mod了!`)
                return
            }

            let target = path.join(
                settings.settings.modStorageLocation,
                settings.settings.managerGame.gameName,
                id
            )

            let res = await Unzipper.unzip(file, target)
            let files: string[] = []
            res.forEach((item) => {
                if (item.status == 'extracted') {
                    files.push(item.file)
                }
            });
            await this.addModInfo(file, parseInt(id), files, md5);
        },
        /**
         * 通过下载任务添加Mod
         * @param task 
         */
        async addModByTask(task: IDownloadTask) {
            this.maxID++
            let id = this.maxID.toString()
            const settings = useSettings()
            if (settings.settings.modStorageLocation == '') {
                ElMessage.error('请先选择Mod存放位置')
                return
            }
            const modStorage = `${settings.settings.modStorageLocation}\\cache\\${task.id}${path.extname(task.link)}`
            let md5 = await FileHandler.getFileMd5(modStorage)
            // 检查是否已经添加
            if (this.isAdded(md5)) {
                ElMessage.error(`您已经添加过 『${path.basename(task.name)}』 这款Mod了!`)
                return
            }

            console.log(id);

            let target = path.join(
                settings.settings.modStorageLocation,
                settings.settings.managerGame.gameName,
                id
            )

            let res = await Unzipper.unzip(modStorage, target)
            let files: string[] = []
            res.forEach((item) => {
                if (item.status == 'extracted') {
                    files.push(item.file)
                }
            });
            let mod: IModInfo = {
                id: parseInt(id),
                webId: task.id,
                modName: task.name,
                md5: md5,
                modVersion: task.version,
                isInstalled: false,
                weight: 500,
                modFiles: files,
                modAuthor: task.modAuthor
            }
            mod.modType = settings.settings.managerGame.checkModType(mod)

            this.managerModList.push(mod)
            ElMessage.success(`『${task.name}』已添加到管理列表`)
        },
        // 在管理器中添加Mod信息
        async addModInfo(file: string, id: number, files: string[], md5: string) {
            // console.log(md5);
            const settings = useSettings()
            let mod: IModInfo = {
                id: id,
                modName: path.basename(file),
                md5: md5,
                modVersion: '1.0.0',
                isInstalled: false,
                weight: 0,
                modFiles: files,
            }
            mod.modType = settings.settings.managerGame.checkModType(mod)

            this.managerModList.push(mod)
            // this.saveModInfo()
        },
        // 保存Mod信息
        saveModInfo() {
            let settings = useSettings()
            let savePath = path.join(settings.settings.modStorageLocation, settings.settings.managerGame.gameName)
            // console.log(savePath);
            Manager.saveModInfo(this.managerModList, savePath)
        },
        // 获取Mod信息
        async getModInfo() {
            let settings = useSettings()
            let savePath = path.join(settings.settings.modStorageLocation, settings.settings.managerGame.gameName)
            this.managerModList = await Manager.getModInfo(savePath)

        },
        // 删除Mod
        deleteMod(mod: IModInfo) {
            let settings = useSettings()
            let savePath = path.join(settings.settings.modStorageLocation, settings.settings.managerGame.gameName, mod.id.toString())
            let modIndex = this.managerModList.findIndex(item => item.id == mod.id)
            // console.log(savePath);

            Manager.deleteMod(savePath)
            this.managerModList.splice(modIndex, 1)

        },
        // 通过md5获取Mod信息
        getModInfoByMd5(md5: string) {
            return this.managerModList.find(item => item.md5 == md5)
        },
        // 通过id获取Mod信息
        getModInfoById(id: number) {
            return this.managerModList.find(item => item.id == id)
        },
        /**
         * 通过Gmm包安装文件
         * @param file 
         */
        async addModByGmm(file: string) {
            if (path.extname(file) != '.gmm') return
            let data = await Unzipper.readZipFile(file, 'info.json')
            let info: IModInfo = JSON.parse(data)

            console.log(info);

            const settings = useSettings()

            // 检查游戏是否正确
            if (info.gameID != settings.settings.managerGame.gameID) {
                ElMessage.error(`『${info.modName}』不是『${settings.settings.managerGame.gameName}』的Mod`)
                return
            }

            // 检查是否已经添加
            if (this.isAdded(info.md5)) {
                ElMessage.error(`您已经添加过『${info.modName}』这款Mod了!`)
                return
            }

            // 检查依赖是否已经添加
            if (info.corePlugins && info.corePlugins.length > 0) {
                info.corePlugins.forEach((item) => {
                    if (!Manager.checkInstalled(item.name, item.id)) return false
                })
            }

            this.maxID++
            info.id = this.maxID
            let id = this.maxID.toString()
            let target = path.join(
                settings.settings.modStorageLocation,
                settings.settings.managerGame.gameName,
                id
            )
            let res = await Unzipper.unzip(file, target)
            this.managerModList.push(info)
            ElMessage.success(`『${info.modName}』已添加到管理列表`)
        }
    }
})