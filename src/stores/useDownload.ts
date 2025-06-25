import { defineStore } from "pinia";
import { extname, join } from "node:path";
import { useSettings } from "./useSettings";
import { ElMessage } from "element-plus";
import { ipcRenderer } from "electron";


import axios from "axios";
export const useDownload = defineStore('Download', {
    state: () => ({
        tab: 'all' as 'all' | "active" | "waiting" | "paused" | "error" | "complete" | "removed",
        downloadTaskList: [] as IDownloadTask[],    // 下载任务列表
        // downloadProcessList: [] as Download[],      // 下载进程列表 进程列表会在重启软件后清空
        searchName: "",
        // aria2: new APIAria2(),
        showAddTaskDialog: false,
        addTaskTab: 'GlossMod',
        form: {
            url: '',
            id: '',
            name: '',
            link: '',
        },
        autoInstall: true,
        isInit: false,
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
         * 通过ID添加下载任务
         * @param id 
         */
        async addDownloadById(mod: IModInfo | IDownloadTask | number, fid?: string | null) {
            let id: number
            if (typeof mod == 'number') {
                id = mod
            } else {
                id = mod.webId as number
            }

            let data: IMod = await ipcRenderer.invoke("get-mod-data", { id })
            // 将 link.value 里面的 http://mod.3dmgame.com 换成 https://mod.3dmgame.com
            console.log(data);

            // data = data.mods_resource_url.replace("http://mod.3dmgame.com", "https://mod.3dmgame.com")
            let resource = data.mods_resource.filter(item => {
                item.mods_resource_url.replace("http://mod.3dmgame.com", "https://mod.3dmgame.com")
                return item.mods_resource_url.includes("https://mod.3dmgame.com")
            })

            if (fid) {
                resource = data.mods_resource.filter(item => item.id == parseInt(fid))
            }


            if (resource.length == 0) {
                window.open(`https://mod.3dmgame.com/mod/${id}`)
                return
            }

            let link = resource[0].mods_resource_url

            // let link = resource[0].mods_resource_url.replace("https://mod.3dmgame.com", "https://dmod.3dmgame.com")

            const { host } = useMain()

            let cover: string
            if (data.mods_image_url) {
                cover = host + data.mods_image_url
            } else {
                cover = host + data.game_imgUrl
            }



            let fileExt = extname(link)
            let fileName = data.id + fileExt
            let task: IDownloadTask = {
                id: APIAria2.randomNumbers(),
                webId: data.id,
                from: "GlossMod",
                name: data.mods_title,
                version: data.mods_version ?? "1.0.0",
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: link,
                modAuthor: data.mods_author,
                status: "waiting",
                fileName: fileName,
                tags: (mod as IModInfo).tags,
                modType: (mod as IModInfo).modType,
                cover: cover
            }
            this.addDownloadTask(task)
        },
        /**
         * 通过ID获取任务
         * @param id 任务ID
         * @returns 
         */
        getTaskById(id: number | string) {
            return this.downloadTaskList.find(item => item.webId == id)
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
            // let url = gmm://installmod/172999?fid=304507
            const params = new URLSearchParams(url.replace("gmm://installmod/", ""));
            const id = params.get("id");
            const fid = params.get("fid");
            console.log(id, fid);

            this.addDownloadById(Number(id), fid)
        },

        async addDownloadByThunderstore(mod: IThunderstoreMod, key?: string) {
            // // 判断是否已经存在
            // if (this.getTaskById(mod.uuid4)) {
            //     // 如果已存在则移除
            //     this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod.uuid4)
            // }
            let fileExt = '.zip'
            let fileName = mod.name + fileExt
            let task: IDownloadTask = {
                id: APIAria2.randomNumbers(),
                webId: mod.package_url,
                from: "Thunderstore",
                name: mod.name,
                version: mod.latest.version_number,
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: mod.latest.download_url,
                modAuthor: mod.owner,
                status: "waiting",
                modWebsite: mod.package_url,
                fileName: fileName,
                key: key,
                cover: mod.versions[0].icon,
                other: {
                    namespace: mod.owner,
                    name: mod.name
                }
            }

            this.addDownloadTask(task)
        },

        async addDownloadByModIo(mod: IModIo) {
            // console.log(mod.id);

            // // 判断是否已经存在
            // if (this.getTaskById(mod.id)) {
            //     // 如果已存在则移除
            //     this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod.id)
            // }

            let fileExt = '.zip'
            let fileName = mod.id + fileExt
            let task: IDownloadTask = {
                id: APIAria2.randomNumbers(),
                webId: mod.id,
                from: "ModIo",
                name: mod.name,
                version: mod.modfile.version ?? "1.0.0",
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: mod.modfile.download.binary_url,
                modAuthor: mod.submitted_by.username,
                status: "waiting",
                modWebsite: mod.profile_url,
                fileName: fileName,
                cover: mod.logo.thumb_640x360,
            }
            this.addDownloadTask(task)

            // let task = this.getTaskById(mod.id) as IDownloadTask

            // const settings = useSettings()

            // // let dest = `${settings.settings.modStorageLocation}\\cache\\`
            // let dest = join(settings.settings.modStorageLocation, 'cache')
            // FileHandler.deleteFile(join(dest, fileName))   // 删除旧文件

            // let gid = await APIAria2.addUri(task.link, fileName, dest).catch(err => {
            //     ElMessage.error(`下载错误: ${err}`)
            // })
            // console.log(gid);

            // task.gid = gid.result

            // ElMessage.success(`${task.name} 已添加到下载列表`)

        },

        async addDownloadByCurseForge(mod: ICurseForgeMod) {
            // // 判断是否已经存在
            // if (this.getTaskById(mod.id)) {
            //     // 如果已存在则移除
            //     this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod.id)
            // }

            // 将 mod.latestFiles[0].downloadUrl 里面的 edge.forgecdn.net 替换为 mediafilez.forgecdn.net
            let downloadUrl = mod.latestFiles[0].downloadUrl.replace("edge.forgecdn.net", "mediafilez.forgecdn.net")

            let fileName = mod.latestFiles[0].fileName
            let task: IDownloadTask = {
                id: APIAria2.randomNumbers(),
                webId: mod.id,
                from: "CurseForge",
                name: mod.name,
                version: mod.latestFilesIndexes[0].gameVersion,
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: downloadUrl,
                modAuthor: mod.authors[0].name,
                modWebsite: mod.links.websiteUrl,
                status: "waiting",
                fileName: fileName,
                cover: mod.logo.thumbnailUrl,
            }

            this.addDownloadTask(task)

            // let task = this.getTaskById(mod.id) as IDownloadTask

            // console.log(task);

            // const settings = useSettings()

            // let dest = join(settings.settings.modStorageLocation, 'cache')

            // FileHandler.deleteFile(join(dest, fileName))   // 删除旧文件

            // let gid = await APIAria2.addUri(task.link, fileName, dest).catch(err => {
            //     ElMessage.error(`下载错误: ${err}`)
            // })
            // console.log(gid);

            // task.gid = gid.result

            // ElMessage.success(`${task.name} 已添加到下载列表`)

        },

        async addDownloadByGitHub(release: IGitHubRelease, website: string, fileName: string) {
            // // 判断是否已经存在
            // if (this.getTaskById(mod.id)) {
            //     // 如果已存在则移除
            //     this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod.id)
            // }

            let _mod = release.assets.find(item => item.name == fileName)
            if (!_mod) {
                ElMessage.warning("未找到对应文件")
                return
            }

            let task: IDownloadTask = {
                id: APIAria2.randomNumbers(),
                webId: release.id,
                from: "GitHub",
                name: release.name,
                version: release.tag_name,
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: _mod.browser_download_url,
                modAuthor: release.author.login,
                modWebsite: website,
                status: "waiting",
                fileName: release.name
            }

            this.addDownloadTask(task)

            // let task = this.getTaskById(mod.id) as IDownloadTask

            // console.log(task);

            // const settings = useSettings()

            // let dest = join(settings.settings.modStorageLocation, 'cache')

            // FileHandler.deleteFile(join(dest, mod.name))   // 删除旧文件

            // let gid = await APIAria2.addUri(task.link, mod.name, dest).catch(err => {
            //     ElMessage.error(`下载错误: ${err}`)
            // })
            // console.log(gid);

            // task.gid = gid.result

            // ElMessage.success(`${task.name} 已添加到下载列表`)

        },

        async addDownloadByGameBanana(id: number) {
            let { data: mod } = await axios.get<IGameBananaMod>(`https://gamebanana.com/apiv11/Mod/${id}/ProfilePage`)

            // // 判断是否已经存在
            // if (this.getTaskById(mod._idRow)) {
            //     // 如果已存在则移除
            //     this.downloadTaskList = this.downloadTaskList.filter(item => item.id != mod._idRow)
            // }

            let { _sBaseUrl, _sFile530 } = mod._aPreviewMedia._aImages[0]
            const cover = `${_sBaseUrl}/${_sFile530}`

            let task: IDownloadTask = {
                id: APIAria2.randomNumbers(),
                webId: mod._idRow,
                from: "GameBanana",
                name: mod._sName,
                version: mod._sVersion || '1.0.0',
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: mod._aFiles[0]._sDownloadUrl,
                modAuthor: mod._aSubmitter._sName,
                modWebsite: mod._sProfileUrl,
                status: "waiting",
                fileName: mod._aFiles[0]._sFile,
                cover: cover
            }

            this.addDownloadTask(task)
        },

        async addDownloadByCustomize(url: string, name: string) {
            let task: IDownloadTask = {
                id: APIAria2.randomNumbers(),
                webId: APIAria2.uuid(),
                from: "Customize",
                name: name,
                version: "1.0.0",
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: url,
                modAuthor: "",
                modWebsite: "",
                status: "waiting",
                fileName: name
            }
            this.addDownloadTask(task)
        },

        async addDownloadByNexusMods(nexusmodsData: INexusModsDownloadData, cover?: string) {
            const { domainName, modId, fileId, key, expires, version, author, modName } = nexusmodsData

            const nexusmods = useNexusMods()
            let get_download_link = `https://api.nexusmods.com/v1/games/${domainName}/mods/${modId}/files/${fileId}/download_link.json`

            if (key) {
                get_download_link = `${get_download_link}?key=${key}&expires=${expires}`
            }

            const { data } = await axios.get(get_download_link, {
                headers: await nexusmods.getheader()
            }).catch(err => ({
                data: {
                    err: true,
                    ...err.response.data
                }
            }))

            // 没有权限, 打开网页 下载
            if (data.err) {
                ElMessage.error(data.message)
                window.open(`https://www.nexusmods.com/${domainName}/mods/${modId}?tab=files&file_id=${fileId}&nmm=1`)
                return
            }

            // 正常获取到下载地址
            console.log(data);
            const { URI, name, short_name } = data[0]

            // URL = https://supporter-files.nexus-cdn.com/3333/2380/RED4ext-2380-1-27-0-1737651915.zip?md5=VZ2VLjGLyXNYWI6HLJ5slA&expires=1743080796&user_id=48836423
            // 从 URL 获取文件后缀
            let fileExt = extname(URI)
            // 移除 ?md5=VZ2VLjGLyXNYWI6HLJ5slA&expires=1743080796&user_id=48836423
            fileExt = fileExt.split("?")[0]
            console.log("fileExt", fileExt);


            let task: IDownloadTask = {
                id: APIAria2.randomNumbers(),
                webId: modId,
                from: "NexusMods",
                name: modName,
                version: version,
                speed: 0,
                totalSize: 0,
                downloadedSize: 0,
                link: URI,
                modAuthor: author,
                modWebsite: `https://www.nexusmods.com/${domainName}/mods/${modId}`,
                status: "waiting",
                fileName: fileId + fileExt,
                other: {
                    domainName, modId, fileId, key, expires, version, author, modName
                },
                cover: cover
            }
            this.addDownloadTask(task)

        },

        // 添加下载任务
        async addDownloadTask(task: IDownloadTask) {


            // 判断是否已经存在
            if (this.getTaskById(task.webId as string)) {
                // 如果已存在则移除
                this.downloadTaskList = this.downloadTaskList.filter(item => item.webId != task.webId)
            }
            this.downloadTaskList.unshift(task)
            const settings = useSettings()
            let dest = join(settings.settings.modStorageLocation, 'cache')

            let gid = await APIAria2.addUri(task.link, task.fileName, dest).catch(err => {
                ElMessage.error(`下载错误: ${err}`)
            })

            task.gid = gid.result
            console.log(task.gid);

            ElMessage.success(`${task.name} 已添加到下载列表`)

            if (!this.isInit) {
                // 跳转到 /download 页面
                const router = window.router || (window as any).$router
                console.log(router);

                if (router) {
                    router.push('/download')
                }
            }

        },

        //#endregion

        //#region 重新下载
        async ReStart(mod: IModInfo | IDownloadTask, modStorage: string) {
            FileHandler.deleteFile(modStorage)
            console.log(mod);

            switch (mod.from) {
                case "GlossMod":
                    this.addDownloadById(mod)
                    break;
                case "Thunderstore":
                    const thunderstore = useThunderstore()
                    if (mod.other) {
                        let data = await thunderstore.getModData(mod.other.namespace, mod.other.name)
                        console.log(data);
                        if (!data.latest) {
                            data.latest = await thunderstore.getModVersionData(mod.other.namespace, mod.other.name, data.versions[0].name)
                        }

                        let key = `${data?.owner}-${data?.name}-${data?.latest.version_number}`
                        this.addDownloadByThunderstore(data, key)
                    }
                    break;
                case 'ModIo':
                    const modio = useModIo()
                    let modio_data = await modio.getModDataById(mod.webId as number)
                    console.log(modio_data);
                    if (modio_data) {
                        this.addDownloadByModIo(modio_data)
                    }
                    break
                case 'CurseForge':
                    const curseforge = useCurseForge()
                    let cf_mod = await curseforge.GetModDataById(mod.webId as number)
                    console.log(cf_mod);
                    if (cf_mod) {
                        this.addDownloadByCurseForge(cf_mod)
                    }

                    break
                case 'GitHub':
                    const github = useGithub()
                    if (mod.modWebsite) {
                        let release = await github.parse(mod.modWebsite)
                        if (release) {
                            console.log(mod.fileName);
                            this.addDownloadByGitHub(release, mod.modWebsite, mod.fileName)
                        }
                    }
                    break
                case 'GameBanana':
                    this.addDownloadByGameBanana(mod.webId as number)
                    break
                case 'NexusMods':
                    if (mod.other) this.addDownloadByNexusMods(mod.other as INexusModsDownloadData)
                    break
                default:
                    break;
            }
        },

        //#endregion
    },
})