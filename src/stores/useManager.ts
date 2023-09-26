import { defineStore } from "pinia";
import path from 'path'
import { getAllExpands } from "@src/Expands";
import type { ISupportedGames, IModInfo, IDownloadTask, IInfo } from "@src/model/Interfaces";
import { ipcRenderer } from "electron";
import { ElMessage } from "element-plus";
import { useSettings } from '@src/stores/useSettings';
import { Manager } from "@src/model/Manager";
import { FileHandler } from "@src/model/FileHandler"
import { Unzipper } from '@src/model/Unzipper'
import { usePacks } from "./usePacks";

export const useManager = defineStore('Manager', {
    state: () => ({
        supportedGames: getAllExpands() as ISupportedGames[],
        managerModList: [] as IModInfo[],
        selectGameDialog: false,
        maxID: 0,
        filterType: 0 as number,
        search: "",
        dragIndex: 0,
        installLoading: false,

    }),
    getters: {
        /**
         * Mod存储路径
         * @returns 
         */
        modStorage() {
            const settings = useSettings()
            return path.join(settings.settings.modStorageLocation, settings.settings.managerGame?.gameName ?? "")
        },
        /**
        * 游戏路径
        * @returns 
        */
        gameStorage() {
            const settings = useSettings()
            return settings.settings.managerGame?.gamePath ?? ""
        },
        filterModList(state) {
            if (state.filterType == 0) return state.managerModList.filter((item) => item?.modName.indexOf(state.search) != -1)
            return state.managerModList.filter(item => item?.modType == state.filterType && item?.modName.indexOf(state.search) != -1)
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
        // 通过webId 判断是否已经添加
        isAddedWebId(id: number) {
            let modId = null as null | number;
            this.managerModList.forEach(item => {
                if (item.webId == id) modId = item.id
            })
            return modId
        },
        // 将选中的Mod文件添加到管理器
        async addModFile(file: string) {

            FileHandler.writeLog(`添加: ${file}`)

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

            let md5 = await FileHandler.getFileMd5(file).catch(err => {
                return ''
            })

            // 检查是否已经添加
            if (this.isAdded(md5)) {
                ElMessage.error(`您已经添加过『${path.basename(file)}』这款Mod了!`)
                return
            }

            let target = path.join(
                settings.settings.modStorageLocation,
                settings.settings.managerGame?.gameName ?? "",
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

            FileHandler.writeLog(`添加: ${task.name}`)

            this.maxID++
            let id = this.maxID.toString()
            const settings = useSettings()
            if (settings.settings.modStorageLocation == '') {
                ElMessage.error('请先选择Mod存放位置')
                return
            }
            const modStorage = `${settings.settings.modStorageLocation}\\cache\\${task.id}${path.extname(task.link)}`
            let md5 = await FileHandler.getFileMd5(modStorage).catch(err => {
                return ''
            })
            // 检查是否已经添加
            if (this.isAdded(md5)) {
                ElMessage.error(`您已经添加过 『${path.basename(task.name)}』 这款Mod了!`)
                return
            }

            console.log(id);

            let target = path.join(
                settings.settings.modStorageLocation,
                settings.settings.managerGame?.gameName || "",
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
            mod.modType = settings.settings.managerGame?.checkModType(mod)

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
            mod.modType = settings.settings.managerGame?.checkModType(mod)

            this.managerModList.push(mod)
            // this.saveModInfo()
        },
        // 保存Mod信息
        saveModInfo() {
            let settings = useSettings()
            let savePath = path.join(settings.settings.modStorageLocation, settings.settings.managerGame?.gameName ?? "")
            // console.log(savePath);
            Manager.saveModInfo(this.managerModList, savePath)
        },
        // 获取Mod信息
        async getModInfo() {
            let settings = useSettings()
            let savePath = path.join(settings.settings.modStorageLocation, settings.settings.managerGame?.gameName ?? "")
            this.managerModList = await Manager.getModInfo(savePath)

        },
        // 删除Mod
        deleteMod(mod: IModInfo) {
            let settings = useSettings()
            let savePath = path.join(settings.settings.modStorageLocation, settings.settings.managerGame?.gameName ?? "", mod.id.toString())
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
        getModInfoByWebId(webId: number) {
            return this.managerModList.find(item => item.webId == webId)
        },
        /**
         * 通过Gmm包安装文件
         * @param file 
         */
        async addModByGmm(file: string) {
            if (path.extname(file) != '.gmm') return

            //#region 读取info
            const packs = usePacks()
            this.installLoading = true
            const settings = useSettings()
            let info: any = JSON.parse(await Unzipper.readZipFile(file, 'info.json'))
            this.installLoading = false

            if (info.gameID != settings.settings.managerGame?.gameID) {
                ElMessage.error(`该 .GMM 包并不属于${settings.settings.managerGame?.gameName}, 请先选择正确的游戏.`)
                return
            }
            console.log(info);
            packs.Info = info
            packs.inputPacks = info.packs
            packs.inpurtFile = file
            packs.inpurtDialog = true
            //#endregion

        },
        // 检查所有Mod更新
        async checkAllModUpdate() {
            let modId = [] as number[]
            this.managerModList.forEach(item => {
                if (item.webId) modId.push(item.webId)
            })

            if (modId.length > 0) {
                ipcRenderer.invoke("check-mod-update", modId).then(({ data }) => {
                    data?.forEach((item: any) => {
                        let mod = this.getModInfoByWebId(item.id)
                        if (mod) {
                            if (mod.modVersion != item.mods_version) {
                                mod.isUpdate = true
                                console.log(`『${mod.modName}』 有新版本可用.`);
                            }
                        }
                    })
                })
            }
        }
    }
})