import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import { useSettings } from "@src/stores/useSettings";
import type { IGamePlugins } from "@src/model/Interfaces"
import axios from "axios";


export const useGames = defineStore("Games", {
    state: () => ({
        search: '',
        showLst: false,
        GamePlugins: [] as IGamePlugins[],
    }),
    getters: {
        gameList(state) {
            const { t } = useI18n()
            const Settings = useSettings()
            let list = Settings.settings.managerGameList
            if (state.search != '') {
                list = list.filter(item => t(item.gameName).includes(state.search))
            }

            return list
        }
    },
    actions: {
        async getGamePlugins() {
            const { data } = await axios.post('https://mod.3dmgame.com/api/v2/GetPluginsList', {}, {
                headers: {
                    "Authorization": "67d8667248a801ff6ddc74ac43016168"
                }
            })
            // console.log(data);
            this.GamePlugins = data.data ?? []

        }
    }
})