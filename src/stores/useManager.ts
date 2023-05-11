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
        selectGameDialog: false,
        supportedGames: getAllExpands() as ISupportedGames[],
        managerModList: [] as IModInfo[],
    }),
    getters: {
        maxModID: (state) => {
            let maxID = 0
            state.managerModList.forEach(mod => {
                if (mod.id > maxID) {
                    maxID = mod.id
                }
            });
            return maxID
        },
        gamePath() {
            const settings = useSettings()
            return settings.settings.managerGame.gamePath
        },
        modStorage() {
            const settings = useSettings()
            return `${settings.settings.modStorageLocation}\\${settings.settings.managerGame.gameEnName}`
        },
        gameStorage() {
            const settings = useSettings()
            return settings.settings.managerGame.gamePath
        }
    },
    actions: {
        // 选择Mod文件
        selectMoeFiles() {
            ipcRenderer.invoke("select-file", {
                properties: ['openFile', 'multiSelections'],
                filters: [
                    { name: 'Zip Files', extensions: ['zip', 'rar', '7z'] },
                ]
            }).then((res: string[]) => {
                if (res.length > 0) {
                    res.forEach(async file => {
                        await this.addModFile(file)
                    });
                }
            })
        },

        isAdded(md5: string) {
            let is = false
            this.managerModList.forEach(item => {
                if (item.md5 == md5) {
                    is = true
                }
            })

            return is
        },

        // 将选中的Mod文件添加到管理器
        async addModFile(file: string) {
            const settings = useSettings()
            const allowedExtensions = ['.zip', '.rar', '.7z'];
            if (!allowedExtensions.some(ext => file.endsWith(ext))) {
                ElMessage.error('不支持的文件类型')
                return
            }

            if (settings.settings.modStorageLocation == '') {
                ElMessage.error('请先选择Mod存放位置')
                return
            }

            let md5 = await FileHandler.getFileMd5(file)

            // 检查是否已经添加
            if (this.isAdded(md5)) {
                ElMessage.error(`您已经添加过『${path.basename(file)}』这款Mod了!`)
                return
            }

            let target = path.join(
                settings.settings.modStorageLocation,
                settings.settings.managerGame.gameEnName,
                (this.maxModID + 1).toString()
            )

            let res = await Unzipper.unzip(file, target)
            let files: string[] = []
            res.forEach((item) => {
                if (item.status == 'extracted') {
                    files.push(item.file)
                }
            });
            await this.addModInfo(file, this.maxModID + 1, files, md5);
        },
        /**
         * 通过下载任务添加Mod
         * @param task 
         */
        async addModByTask(task: IDownloadTask) {
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
            let target = path.join(
                settings.settings.modStorageLocation,
                settings.settings.managerGame.gameEnName,
                (this.maxModID + 1).toString()
            )

            let res = await Unzipper.unzip(modStorage, target)
            let files: string[] = []
            res.forEach((item) => {
                if (item.status == 'extracted') {
                    files.push(item.file)
                }
            });
            this.managerModList.push({
                id: this.maxModID + 1,
                webId: task.id,
                modName: task.name,
                md5: md5,
                modVersion: task.version,
                isInstalled: false,
                weight: 0,
                modFiles: files,
                modAuthor: task.modAuthor

            })
            ElMessage.success(`『${task.name}』已添加到管理列表`)
        },
        // 在管理器中添加Mod信息
        async addModInfo(file: string, id: number, files: string[], md5: string) {
            // console.log(md5);

            let mod: IModInfo = {
                id: id,
                modName: path.basename(file),
                md5: md5,
                modVersion: '1.0.0',
                isInstalled: false,
                weight: 0,
                modFiles: files,
            }
            this.managerModList.push(mod)
            // this.saveModInfo()
        },
        // 保存Mod信息
        saveModInfo() {
            let settings = useSettings()
            let savePath = path.join(settings.settings.modStorageLocation, settings.settings.managerGame.gameEnName)
            // console.log(savePath);
            Manager.saveModInfo(this.managerModList, savePath)
        },
        // 获取Mod信息
        getModInfo() {
            let settings = useSettings()
            let savePath = path.join(settings.settings.modStorageLocation, settings.settings.managerGame.gameEnName)
            this.managerModList = Manager.getModInfo(savePath)

        },
        // 删除Mod
        deleteMod(mod: IModInfo) {
            let settings = useSettings()
            let savePath = path.join(settings.settings.modStorageLocation, settings.settings.managerGame.gameEnName, mod.id.toString())
            let modIndex = this.managerModList.findIndex(item => item.id == mod.id)
            // console.log(savePath);

            Manager.deleteMod(savePath)
            this.managerModList.splice(modIndex, 1)

        },
        getModInfoByMd5(md5: string) {
            return this.managerModList.find(item => item.md5 == md5)
        }
    }
})