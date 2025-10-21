import { defineStore } from "pinia";
import { _3DMApi } from "@/model/_3DMApi";
export const useGames = defineStore("Games", {
    state: () => ({
        search: "",
        showLst: false,
        GamePlugins: [] as IGamePlugins[],
        showExpandsGame: false,
    }),
    getters: {
        // gameList(state) {
        //     const { t } = useI18n()
        //     const Settings = useSettings()
        //     let list = Settings.settings.managerGameList
        //     if (state.search != '') {
        //         list = list.filter(item => t(item.gameName).includes(state.search))
        //     }
        //     return list
        // }
    },
    actions: {
        async getGamePlugins() {
            const settings = useSettings();
            if (!settings.settings.showPlugins) {
                this.GamePlugins = [];
                return;
            }

            try {
                const data = await _3DMApi.getplugins();

                if (data && data.data) {
                    this.GamePlugins = data.data;
                } else {
                    this.GamePlugins = [];
                }
            } catch (error) {
                console.error("获取前置列表失败:", error);
                this.GamePlugins = [];
            }
        },
    },
});
