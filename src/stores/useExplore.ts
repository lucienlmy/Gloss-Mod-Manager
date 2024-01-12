import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import type { IGameInfo, IMod, ISupportedGames } from "@src/model/Interfaces";
import { useSettings } from "@src/stores/useSettings";
import { useUser } from "@src/stores/useUser";

export const useExplore = defineStore('Explore', {
    state: () => ({
        searchText: "",
        page: 1,
        pageSize: 24,
        original: 0,
        time: 0,
        order: 0,
        key: 0,
        gameType: 0,
        mods: [] as IMod[],
        gameList: [] as ISupportedGames[],
        showTourGameListDialog: false,
        gameTypeList: [] as any[],
        count: 1,
        // gameId: 0 as number | string

    }),
    getters: {
        pageLength: (state) => Math.ceil(state.count / state.pageSize),
        gameId: () => {
            const settings = useSettings()
            let id = 0 as number | string
            if (settings.settings.managerGame?.gameID) id = settings.settings.managerGame?.gameID
            else {
                id = settings.settings.tourGameList.join(',')
            }
            return id
        }
    },
    actions: {
        async GetModList() {
            const user = useUser()

            let data = await ipcRenderer.invoke("get-mod-list", {
                page: this.page,
                pageSize: this.pageSize,
                title: this.searchText,
                original: this.original,
                time: this.time,
                order: this.order,
                key: this.key,
                gameId: this.gameId,
                gameType: this.gameType,
                show_adult: user.user?.user_p_show_adult == 1 ?? null,
                show_charge: user.user?.user_p_show_charge == 1 ?? null,
            })

            this.mods = data.data.mod
            this.count = data.data.count
            document.documentElement.scrollTop = 0

        },
        getGameType() {
            const settings = useSettings()
            ipcRenderer.invoke("get-types", { gameId: settings.settings.managerGame?.gameID }).then(data => {
                // console.log(data);
                data.forEach((item: any) => {
                    this.gameTypeList.push({
                        value: item.id,
                        text: item.mods_type_name
                    })
                })
            })
        },
        search() {
            this.page = 1
            this.GetModList()
        }
    }
})