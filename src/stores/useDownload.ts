import { defineStore } from "pinia";
import { extname, join } from "node:path";
import type { IDownloadTask } from "@src/model/Interfaces";
import { DownloadStatus } from "@src/model/Interfaces";
import { useSettings } from "./useSettings";
import { Download } from "@src/model/Download"
import { FileHandler } from "@src/model/FileHandler"
import { ElMessage } from "element-plus";
import { ipcRenderer } from "electron";
import { useManager } from "@src/stores/useManager";

export const useDownload = defineStore('Download', {
    state: () => ({
        tab: 'all' as 'all' | 0 | 1 | 2 | 3,
        downloadTaskList: [] as IDownloadTask[],    // 下载任务列表
        downloadProcessList: [] as Download[],      // 下载进程列表 进程列表会在重启软件后清空
        searchName: "",
    }),
    getters: {
        configPath() {
            const settings = useSettings()
            return `${settings.settings.modStorageLocation}\\cache\\download.json`
        }
    },
    actions: {
        async initialization() {
            let config = await FileHandler.readFileSync(this.configPath, "[]")  // 读取文件
            this.downloadTaskList = JSON.parse(config)    // 转换为对象

            this.downloadTaskList.forEach(item => {
                if (item.state == DownloadStatus.DOWNLOADING) {
                    item.state = DownloadStatus.PAUSED
                }
            })
        },
        /**
         * 添加下载任务
         * @param modData 
         */
        addDownloadTask(modData: any) {

            // 判断是否已经存在
            if (this.getTaskById(modData.id)) {
                // 如果已存在则移除
                this.downloadTaskList = this.downloadTaskList.filter(item => item.id != modData.id)
            }

            this.downloadTaskList.unshift({
                id: modData.id,
                name: modData.mods_title,
                version: modData.mods_version,
                state: DownloadStatus.WAITING,
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: modData.mods_resource_url,
                modAuthor: modData.mods_author
            })

            let task = this.getTaskById(modData.id) as IDownloadTask

            const settings = useSettings()
            let fileExt = extname(task.link)
            let dest = `${settings.settings.modStorageLocation}\\cache\\${task.id}${fileExt}`

            console.log(`删除: ${dest}`);
            FileHandler.deleteFile(dest)

            let download = new Download(task, dest, this.listen(task).onProgress)
            this.downloadProcessList.push(download)
            ElMessage.success(`${task.name} 已添加到下载列表`)
            download.start()

        },
        /**
         * 通过ID添加下载任务
         * @param id 
         */
        async addDownloadById(id: number) {
            let data = await ipcRenderer.invoke("get-mod-data", { id })
            // 将 link.value 里面的 http://mod.3dmgame.com 换成 https://mod.3dmgame.com
            console.log(id);

            data.mods_resource_url = data.mods_resource_url.replace("http://mod.3dmgame.com", "https://mod.3dmgame.com")
            let link = data.mods_resource_url

            if (!link.includes("https://mod.3dmgame.com")) {
                window.open(`https://mod.3dmgame.com/mod/${id}`)
                return
            }
            this.addDownloadTask(data)
        },
        /**
         * 通过ID获取任务
         * @param id 任务ID
         * @returns 
         */
        getTaskById(id: number): IDownloadTask | undefined {
            return this.downloadTaskList.find(item => item.id == id) as IDownloadTask
        },
        /**
         * 保存任务配置
         */
        saveTaskConfig() {
            let tasks: IDownloadTask[] = JSON.parse(JSON.stringify(this.downloadTaskList))
            FileHandler.writeFile(this.configPath, JSON.stringify(tasks))
        },
        listen(task: IDownloadTask) {
            return {
                task,
                onProgress(downloadedSize: number, totalSize: number, speed: number) {
                    // // 计算下载进度 并保留2位小数
                    task.speed = speed
                    task.totalSize = totalSize
                    task.downloadedSize = downloadedSize
                    // 状态
                    task.state = DownloadStatus.DOWNLOADING
                    if (downloadedSize >= totalSize) {
                        ElMessage.success(`${task.name} 下载完成`)
                        task.state = DownloadStatus.COMPLETED

                        const settings = useSettings()
                        console.log(settings.settings.autoInstall);

                        if (settings.settings.autoInstall) {
                            const manager = useManager()

                            if (extname(task.link) == '.gmm') {
                                let file = join(settings.settings.modStorageLocation, 'cache', `${task.id}.gmm`)
                                manager.addModByGmm(file)
                            } else {
                                manager.addModByTask(task)
                            }
                        }
                    }
                }
            }
        },
        async addDownloadByWeb(url: string) {
            if (!url.startsWith("gmm://installmod")) return
            // let url = gmm://installmod/172999?game=185&name=只狼：影逝二度
            const params = new URLSearchParams(url.replace("gmm://installmod/", ""));
            const id = params.get("id");
            const game = params.get("game");
            const name = params.get("name");
            const settings = useSettings()

            if (!settings.settings.managerGame) {
                ElMessage.error(`该Mod是 ${name} 的Mod, 请先在“管理”中选择此游戏.`)
                return
            }


            if (game != (settings.settings.managerGame.gameID).toString()) {
                ElMessage.error(`该Mod是 ${name} 的Mod, 无法安装到 ${settings.settings.managerGame.gameName} 中.`)
                return
            }

            this.addDownloadById(Number(id))

        }
    }
})