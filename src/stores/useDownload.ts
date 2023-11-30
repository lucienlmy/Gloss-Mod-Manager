import { defineStore } from "pinia";
import { extname, join } from "node:path";
import type { IDownloadTask, IMod, IModInfo } from "@src/model/Interfaces";
// import { DownloadStatus } from "@src/model/Interfaces";
import { useSettings } from "./useSettings";
// import { Download } from "@src/model/Download"
import { FileHandler } from "@src/model/FileHandler"
import { ElMessage } from "element-plus";
import { ipcRenderer } from "electron";
import { APIAria2 } from "@src/model/APIAria2";
import { useNexusMods } from "./useNexusMods";

export const useDownload = defineStore('Download', {
    state: () => ({
        tab: 'all' as 'all' | "active" | "waiting" | "paused" | "error" | "complete" | "removed",
        downloadTaskList: [] as IDownloadTask[],    // 下载任务列表
        // downloadProcessList: [] as Download[],      // 下载进程列表 进程列表会在重启软件后清空
        searchName: "",
        aria2: new APIAria2(),
        showAddTaskDialog: false,
        addTaskTab: 0,
        form: {
            url: '',
            id: '',
            name: '',
            link: '',
        },
        autoInstall: true,
    }),
    getters: {
        configPath(): string {
            const settings = useSettings()
            return `${settings.settings.modStorageLocation}\\cache\\download.json`
        }
    },
    actions: {
        async initialization() {
            let config = await FileHandler.readFileSync(this.configPath, "[]")  // 读取文件
            this.downloadTaskList = JSON.parse(config)    // 转换为对象

            // this.downloadTaskList.forEach(item => {
            //     if (item.state == DownloadStatus.DOWNLOADING) {
            //         item.state = DownloadStatus.PAUSED
            //     }
            // })
        },
        /**
         * 添加下载任务
         * @param modData 
         */
        async addDownloadTask(modData: IMod, type: "GlossMod" | "NexusMods" = "GlossMod") {

            // 判断是否已经存在
            if (this.getTaskById(modData.id)) {
                // 如果已存在则移除
                this.downloadTaskList = this.downloadTaskList.filter(item => item.id != modData.id)
            }

            this.downloadTaskList.unshift({
                id: modData.id,
                type: type,
                nexus_id: modData.nexus_id,
                name: modData.mods_title,
                version: modData.mods_version ?? "1.0.0",
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: modData.mods_resource_url,
                modAuthor: modData.mods_author,
                status: "waiting"
            })

            let task = this.getTaskById(modData.id) as IDownloadTask
            const settings = useSettings()
            let fileExt = extname(task.link)
            // let dest = `${settings.settings.modStorageLocation}\\cache\\`
            let dest = join(settings.settings.modStorageLocation, 'cache')
            FileHandler.deleteFile(join(dest, `${task.id}${fileExt}`))

            let gid = await this.aria2.addUri(task.link,
                type == "GlossMod" ? `${task.id}${fileExt}` : `${task.nexus_id}.${task.link.match(/\.(\w+)(\?.*)?$/)?.[1]}`,
                dest).catch(err => {
                    ElMessage.error(`下载错误: ${err}`)
                })
            console.log(gid);

            // if (!gid.result) {
            //     ElMessage.error(`下载错误: ${JSON.stringify(gid)}`)
            // }

            task.gid = gid.result

            ElMessage.success(`${task.name} 已添加到下载列表`)

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

        /**
         * 通过网页添加下载任务
         * @param url 
         */
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
        },

        /**
         * 通过 N网 添加下载任务
         */
        async addDownloadByNexus(mod: IMod, url: string, game_domain_name: string) {
            console.log(mod);
            console.log(url);
            // https://cf-files.nexusmods.com/cdn/3333/10721/volhitka's Set of Materials-10721-1-0-0-1699248348.zip?md5=SlNeaPS0_CY_wvWg5QdOkw&expires=1699268500&user_id=193204934&rip=46.232.121.88
            // 正则获取文件后缀 .zip
            let fileExt = url.match(/\.(\w+)(\?.*)?$/)?.[1]
            // 正则匹配 https://cf-files.nexusmods.com/cdn/3333/10721/volhitka's Set of Materials-10721-1-0-0-1699248348.zip?md5=SlNeaPS0_CY_wvWg5QdOkw&expires=1699268500&user_id=193204934&rip=46.232.121.88 中的  1-0-0 为 1.0.0
            let version = url.match(/-(\d+-\d+-\d+-\d+)-/)?.[1]?.replace(/-/g, '.')
            version = version?.replace(`${mod.id}.`, '')
            console.log(fileExt);

            mod.mods_version = version
            mod.mods_resource_url = url
            mod.nexus_id = `${game_domain_name}_${mod.id}`;

            this.addDownloadTask(mod, "NexusMods")
        },

        async addDownloadByNuxusId(id: number, game_domain_name: string) {

            const nexusMods = useNexusMods()
            let data = await nexusMods.GetModData(id, game_domain_name);
            let url = await nexusMods.GetDownloadUrl(id, game_domain_name)

            let mod: any = {
                id: data.mod_id,
                mods_title: data.name,
                mods_author: data.author,
                // mods_resource_url:url,
                // mods_version: data.version,
                // nexus_id: `${game_domain_name}_${id}`,
            }

            this.addDownloadByNexus(mod, url, game_domain_name)

        }

    }
})