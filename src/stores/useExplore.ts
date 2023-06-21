import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import type { IGameInfo, IMod } from "@src/model/Interfaces";
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
        game: [] as IGameInfo[],
        gameTypeList: [] as any[],
        count: 1,

    }),
    getters: {
        pageLength: (state) => Math.ceil(state.count / state.pageSize),
    },
    actions: {
        GetModList() {
            const settings = useSettings()
            const user = useUser()
            ipcRenderer.send("get-mod-list", {
                page: this.page,
                pageSize: this.pageSize,
                title: this.searchText,
                original: this.original,
                time: this.time,
                order: this.order,
                key: this.key,
                gameId: settings.settings.managerGame?.gameID ?? null,
                gameType: this.gameType,
                show_adult: user.user?.user_p_show_adult == 1 ?? null,
                show_charge: user.user?.user_p_show_charge == 1 ?? null,
            })
        },
        getGameType() {
            const settings = useSettings()
            ipcRenderer.invoke("get-types", { gameId: settings.settings.managerGame.gameID }).then(data => {
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