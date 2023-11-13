// NexusMods
import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import * as cheerio from 'cheerio';
import { IMod } from "@src/model/Interfaces";
import { useSettings } from "./useSettings";


export const useNexusMods = defineStore('NexusMods', {
    state: () => ({
        mods: [] as IMod[],
        page: 1,
        pageSize: 20,
        count: 1,
        time: null,
        searchText: "",
        sort_by: "lastupdate",
    }),
    getters: {
        pageLength: (state) => Math.ceil(state.count / state.pageSize),
    },
    actions: {
        search() {
            this.page = 1
            this.GetModList()
        },
        async GetModList() {

            let { page, pageSize, sort_by, searchText, time } = this

            const settings = useSettings()
            let game_id = settings.settings.managerGame?.NexusMods?.game_id
            // search[filename]:2077

            let res = await ipcRenderer.invoke("nexus-mods-get-mod-list", {
                game_id, page, pageSize, sort_by, time,
                "search[filename]": searchText
            })

            if (res) {
                // 正则获取 window.setDataLayerEvent(6768); 
                this.count = Number(res.match(/window.setDataLayerEvent\((\d+)\);/)[1])
                // console.log(res);

                let $ = cheerio.load(res)
                // 获取所有节点
                let list = $('.mod-tile').toArray()
                let mod_list = [] as any[]
                list.forEach((item) => {
                    let id = $(item).find('.mod-image').attr('href')?.split('/').pop()
                    let mods_image_url = $(item).find('.mod-image .fore').attr('src')
                    let mods_author = $(item).find('.realauthor').text().replace('Author: ', '')
                    let mods_updateTime = $(item).find('.date').attr('datetime')
                    let mods_click_cnt = $(item).find('.endorsecount .flex-label').text()
                    let mods_download_cnt = $(item).find('.downloadcount .flex-label').text()
                    let mods_resource_size = $(item).find('.sizecount .flex-label').text()
                    let mods_title = $(item).find('.motm-tile .tile-name').text()

                    mod_list.push({
                        id, mods_image_url, mods_author, mods_updateTime, mods_click_cnt,
                        mods_download_cnt, mods_resource_size, mods_title,
                    })
                })

                this.mods = mod_list
            }
        },
        async GetDownloadUrl(id: number, game_domain_name: string) {

            let res = await ipcRenderer.invoke("nexus-mods-get-download-url", {
                game_domain_name, id,
                apikey: "xrkLh8SMczoNQ0LAXfOL+OHdAH1ITzv56eax5q1Ntr042yA=--A0lHVHIda7e74Vge--dsxg3fNPmPAiZwxwyUd7Rw=="
            })
            res = res.replace(/undefined/g, '')
            let { url } = JSON.parse(res);
            return url as string
        },
        async GetModData(id: number, game_domain_name: string) {
            let res = await ipcRenderer.invoke("nexus-mods-get-mod-data", {
                game_domain_name, id,
                apikey: "xrkLh8SMczoNQ0LAXfOL+OHdAH1ITzv56eax5q1Ntr042yA=--A0lHVHIda7e74Vge--dsxg3fNPmPAiZwxwyUd7Rw=="
            })
            res = res.replace(/undefined/g, '')
            let data = JSON.parse(res);
            console.log(data);
            return data
        }
    }
})