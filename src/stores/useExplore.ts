import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import { IGameInfo, IMod } from "@src/model/Interfaces";

export const useExplore = defineStore('Explore', {
    state: () => ({
        searchText: "",
        page: 1,
        pageSize: 24,
        original: 0,
        time: 0,
        order: 0,
        key: 0,
        mods: [] as IMod[],
        game: [] as IGameInfo[],
        count: 1,
    }),
    getters: {
        pageLength: (state) => Math.ceil(state.count / state.pageSize),
    },
    actions: {
        GetModList() {
            ipcRenderer.send("get-mod-list", {
                page: this.page,
                pageSize: this.pageSize,
                title: this.searchText,
                original: this.original,
                time: this.time,
                order: this.order,
                key: this.key,
            })
        },
        search() {
            this.page = 1
            this.GetModList()
        }
    }
})