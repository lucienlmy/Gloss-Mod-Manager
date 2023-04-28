import { defineStore } from "pinia";
import path from 'path'
import { getAllExpands } from "@src/Expands";
import type { IGameInfo, ISupportedGames, IModInfo } from "@src/model/Interfaces";
import { ipcRenderer } from "electron";
import { ElMessage } from "element-plus";
import { useSettings } from '@src/stores/useSettings';


export const useManager = defineStore('Manager', {
    state: () => ({
        selectGameDialog: false,
        supportedGames: getAllExpands() as ISupportedGames[],
        managerModList: [] as IModInfo[],
    }),

    actions: {
        addModInfo(file: string) {
            let mod: IModInfo = {
                id: this.managerModList.length,
                modName: path.basename(file),
                modVersion: '1.0.0',
                modType: 1,
                isInstalled: false,
                weight: 0,
                modFiles: [],
            }
            this.managerModList.push(mod)
        },
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

            await ipcRenderer.invoke('unzip-file', {
                source: file,
                target: path.join(
                    settings.settings.modStorageLocation,
                    settings.settings.managerGame.gameEnName,
                    this.managerModList.length.toString()
                )
            }).then((res) => {
                this.addModInfo(file);
            }).catch((err) => {
                console.log(err);
                ElMessage.error(`${file} 解压失败. ${err}`);
            })
        }
    }
})