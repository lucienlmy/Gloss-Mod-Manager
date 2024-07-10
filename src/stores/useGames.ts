import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import { useSettings } from "@src/stores/useSettings";


export const useGames = defineStore("Games", {
    state: () => ({
        search: '',
        showLst: false,
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

    }
})