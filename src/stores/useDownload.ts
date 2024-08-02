import { defineStore } from "pinia";
import { extname, join } from "node:path";
import type { IDownloadTask, IMod, IModInfo, IThunderstoreMod, sourceType, IModIo, ICurseForgeMod, IGitHubAsset } from "@src/model/Interfaces";
// import { DownloadStatus } from "@src/model/Interfaces";
import { useSettings } from "./useSettings";
// import { Download } from "@src/model/Download"
import { FileHandler } from "@src/model/FileHandler"
import { ElMessage } from "element-plus";
import { ipcRenderer } from "electron";
import { APIAria2 } from "@src/model/APIAria2";
import { useNexusMods } from "@src/stores/useNexusMods";
import { useModIo } from '@src/stores/useModIo';
import { useThunderstore } from '@src/stores/useThunderstore';
import { useCurseForge } from '@src/stores/useCurseForge';
import { useGithub } from "@src/stores/useGithub";

export const useDownload = defineStore('Download', {
    state: () => ({
        tab: 'all' as 'all' | "active" | "waiting" | "paused" | "error" | "complete" | "removed",
        downloadTaskList: [] as IDownloadTask[],    // 下载任务列表
        // downloadProcessList: [] as Download[],      // 下载进程列表 进程列表会在重启软件后清空
        searchName: "",
        aria2: new APIAria2(),
        showAddTaskDialog: false,
        addTaskTab: 'GlossMod',
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
        },
        /**
         * 添加下载任务
         * @param mod 
         */
        async addDownloadTask(mod: IMod, type: sourceType = "GlossMod") {

            // 判断是否已经存在
            if (this.getTaskById(mod.id)) {
                // 如果已存在则移除
                this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod.id)
            }
            let fileExt = extname(mod.mods_resource_url)
            let fileName = mod.id + fileExt
            this.downloadTaskList.unshift({
                id: mod.id,
                type: type,
                name: mod.mods_title,
                version: mod.mods_version ?? "1.0.0",
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: mod.mods_resource_url,
                modAuthor: mod.mods_author,
                status: "waiting",
                fileName: fileName
            })

            let task = this.getTaskById(mod.id) as IDownloadTask
            const settings = useSettings()
            // let dest = `${settings.settings.modStorageLocation}\\cache\\`
            let dest = join(settings.settings.modStorageLocation, 'cache')
            FileHandler.deleteFile(join(dest, fileName))

            let gid = await this.aria2.addUri(task.link, fileName, dest).catch(err => {
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
        getTaskById(id: number | string) {
            return this.downloadTaskList.find(item => item.id == id)
        },

        /**
         * 保存任务配置
         */
        saveTaskConfig() {
            let tasks: IDownloadTask[] = JSON.parse(JSON.stringify(this.downloadTaskList))
            FileHandler.writeFile(this.configPath, JSON.stringify(tasks))
        },

        //#region 添加下载到任务

        /**
         * 通过网页添加下载任务
         * @param url 
         */
        async addDownloadByWeb(url: string) {
            if (!url.startsWith("gmm://installmod")) return
            // let url = gmm://installmod/172999?game=185&name=只狼：影逝二度
            const params = new URLSearchParams(url.replace("gmm://installmod/", ""));
            const id = params.get("id");
            // const game = params.get("game");
            // const name = params.get("name");
            // const settings = useSettings()

            // if (!settings.settings.managerGame) {
            //     ElMessage.error(`该Mod是 ${name} 的Mod, 请先在“管理”中选择此游戏.`)
            //     return
            // }

            // if (game != (settings.settings.managerGame.GlossGameId).toString()) {
            //     ElMessage.error(`该Mod是 ${name} 的Mod, 无法安装到 ${settings.settings.managerGame.gameName} 中.`)
            //     return
            // }

            this.addDownloadById(Number(id))
        },

        /**
         * 通过 第三方网站 添加下载任务
         */
        async addDownloadByNexus(mod: IMod, url: string, game_domain_name: string) {
            // console.log(mod);
            // console.log(url);
            // // https://cf-files.nexusmods.com/cdn/3333/10721/volhitka's Set of Materials-10721-1-0-0-1699248348.zip?md5=SlNeaPS0_CY_wvWg5QdOkw&expires=1699268500&user_id=193204934&rip=46.232.121.88
            // // 正则获取文件后缀 .zip
            // let fileExt = url.match(/\.(\w+)(\?.*)?$/)?.[1]
            // // 正则匹配 https://cf-files.nexusmods.com/cdn/3333/10721/volhitka's Set of Materials-10721-1-0-0-1699248348.zip?md5=SlNeaPS0_CY_wvWg5QdOkw&expires=1699268500&user_id=193204934&rip=46.232.121.88 中的  1-0-0 为 1.0.0
            // let version = url.match(/-(\d+-\d+-\d+-\d+)-/)?.[1]?.replace(/-/g, '.')
            // version = version?.replace(`${mod.id}.`, '')
            // console.log(fileExt);

            // mod.mods_version = version
            // mod.mods_resource_url = url
            // mod.nexus_id = `${game_domain_name}_${mod.id}`;

            // this.addDownloadTask(mod, "NexusMods")
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

        },

        async addDownloadByThunderstore(mod: IThunderstoreMod, key?: string) {

            // 判断是否已经存在
            if (this.getTaskById(mod.uuid4)) {
                // 如果已存在则移除
                this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod.uuid4)
            }
            let fileExt = '.zip'

            let fileName = mod.name + fileExt
            this.downloadTaskList.unshift({
                id: mod.package_url,
                type: "Thunderstore",
                name: mod.name,
                version: mod.latest.version_number,
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: mod.latest.download_url,
                modAuthor: mod.owner,
                status: "waiting",
                website: mod.package_url,
                fileName: fileName,
                Thunderstore: {
                    namespace: mod.owner,
                    name: mod.name
                },
                key: key
            })

            let task = this.getTaskById(mod.package_url) as IDownloadTask

            const settings = useSettings()
            // let dest = `${settings.settings.modStorageLocation}\\cache\\`
            let dest = join(settings.settings.modStorageLocation, 'cache')
            FileHandler.deleteFile(join(dest, fileName))

            let gid = await this.aria2.addUri(task.link, fileName, dest).catch(err => {
                ElMessage.error(`下载错误: ${err}`)
            })
            console.log(gid);

            task.gid = gid.result

            ElMessage.success(`${task.name} 已添加到下载列表`)

        },

        async addDownloadByModIo(mod: IModIo) {
            console.log(mod.id);

            // 判断是否已经存在
            if (this.getTaskById(mod.id)) {
                // 如果已存在则移除
                this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod.id)
            }

            let fileExt = '.zip'
            let fileName = mod.id + fileExt
            this.downloadTaskList.unshift({
                id: mod.id,
                type: "ModIo",
                name: mod.name,
                version: mod.modfile.version ?? "1.0.0",
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: mod.modfile.download.binary_url,
                modAuthor: mod.submitted_by.username,
                status: "waiting",
                website: mod.profile_url,
                fileName: fileName
            })

            let task = this.getTaskById(mod.id) as IDownloadTask

            const settings = useSettings()

            // let dest = `${settings.settings.modStorageLocation}\\cache\\`
            let dest = join(settings.settings.modStorageLocation, 'cache')
            FileHandler.deleteFile(join(dest, fileName))   // 删除旧文件

            let gid = await this.aria2.addUri(task.link, fileName, dest).catch(err => {
                ElMessage.error(`下载错误: ${err}`)
            })
            console.log(gid);

            task.gid = gid.result

            ElMessage.success(`${task.name} 已添加到下载列表`)


        },

        async addDownloadByCurseForge(mod: ICurseForgeMod) {
            // 判断是否已经存在
            if (this.getTaskById(mod.id)) {
                // 如果已存在则移除
                this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod.id)
            }

            // 将 mod.latestFiles[0].downloadUrl 里面的 edge.forgecdn.net 替换为 mediafilez.forgecdn.net
            let downloadUrl = mod.latestFiles[0].downloadUrl.replace("edge.forgecdn.net", "mediafilez.forgecdn.net")

            let fileName = mod.latestFiles[0].fileName
            this.downloadTaskList.unshift({
                id: mod.id,
                type: "CurseForge",
                name: mod.name,
                version: mod.latestFilesIndexes[0].gameVersion,
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: downloadUrl,
                modAuthor: mod.authors[0].name,
                website: mod.links.websiteUrl,
                status: "waiting",
                fileName: fileName
            })
            let task = this.getTaskById(mod.id) as IDownloadTask

            console.log(task);


            const settings = useSettings()

            let dest = join(settings.settings.modStorageLocation, 'cache')

            FileHandler.deleteFile(join(dest, fileName))   // 删除旧文件

            let gid = await this.aria2.addUri(task.link, fileName, dest).catch(err => {
                ElMessage.error(`下载错误: ${err}`)
            })
            console.log(gid);

            task.gid = gid.result

            ElMessage.success(`${task.name} 已添加到下载列表`)

        },

        async addDownloadByGitHub(mod: IGitHubAsset, version: string, website: string) {
            // 判断是否已经存在
            if (this.getTaskById(mod.id)) {
                // 如果已存在则移除
                this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod.id)
            }

            this.downloadTaskList.unshift({
                id: mod.id,
                type: "GitHub",
                name: mod.name,
                version: version,
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: mod.browser_download_url,
                modAuthor: mod.uploader.login,
                website: website,
                status: "waiting",
                fileName: mod.name
            })
            let task = this.getTaskById(mod.id) as IDownloadTask

            console.log(task);


            const settings = useSettings()

            let dest = join(settings.settings.modStorageLocation, 'cache')

            FileHandler.deleteFile(join(dest, mod.name))   // 删除旧文件

            let gid = await this.aria2.addUri(task.link, mod.name, dest).catch(err => {
                ElMessage.error(`下载错误: ${err}`)
            })
            console.log(gid);

            task.gid = gid.result

            ElMessage.success(`${task.name} 已添加到下载列表`)

        },

        async addDownloadByCustomize(url: string, name: string) {
            let task: IDownloadTask = {
                id: APIAria2.uuid(),
                type: "Customize",
                name: name,
                version: "1.0.0",
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: url,
                modAuthor: "",
                website: "",
                status: "waiting",
                fileName: name
            }
            this.downloadTaskList.unshift(task)
            const settings = useSettings()
            let dest = join(settings.settings.modStorageLocation, 'cache')

            let gid = await this.aria2.addUri(task.link, name, dest).catch(err => {
                ElMessage.error(`下载错误: ${err}`)
            })

            console.log(gid);
            task.gid = gid.result
            ElMessage.success(`${task.name} 已添加到下载列表`)

        },

        //#endregion


        //#region 重新下载
        async ReStart(task: IDownloadTask, modStorage: string) {
            FileHandler.deleteFile(modStorage)

            switch (task.type) {
                case "GlossMod":
                    this.addDownloadById(task.id as number)
                    break;
                // case "NexusMods":
                //     if (task.nexus_id) {
                //         let { id, game_domain_name } = task.nexus_id.match(/(?<game_domain_name>.+)_(?<id>\d+)/)?.groups as any
                //         download.addDownloadByNuxusId(id, game_domain_name)
                //     }
                //     break;
                case "Thunderstore":
                    const thunderstore = useThunderstore()
                    let t_mod = await thunderstore.getModData(task.Thunderstore?.namespace, task.Thunderstore?.name)
                    t_mod.uuid4 = task.id as string
                    this.addDownloadByThunderstore(t_mod)
                    break;
                case 'ModIo':
                    const modio = useModIo()
                    let modio_data = await modio.getModDataById(task.id as number)
                    console.log(modio_data);
                    if (modio_data) {
                        this.addDownloadByModIo(modio_data)
                    }
                    break
                case 'CurseForge':
                    const curseforge = useCurseForge()
                    let cf_mod = await curseforge.GetModDataById(task.id as string)
                    console.log(cf_mod);
                    if (cf_mod) {
                        this.addDownloadByCurseForge(cf_mod)
                    }

                    break
                case 'GitHub':
                    const github = useGithub()
                    if (task.website) {
                        let release = await github.parse(task.website)
                        if (release) {
                            let mod = release.assets.find(item => item.name == task.fileName)
                            if (mod) {
                                this.addDownloadByGitHub(mod, release.tag_name, task.website)
                            }
                        }
                    }
                    break
                default:
                    break;
            }
        },


        //#endregion
    }
})