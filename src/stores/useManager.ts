import { defineStore } from "pinia";
import { getAllExpands } from "@src/Expands";
import type { IGameInfo, ISupportedGames, IModInfo } from "@src/model/Interfaces";

export const useManager = defineStore('Manager', {
    state: () => ({
        selectGameDialog: false,
        allGameList: [] as IGameInfo[],
        managerGame: null as ISupportedGames | null,
        supportedGames: getAllExpands() as ISupportedGames[],
        managerModList: [] as IModInfo[],
    }),
    getters: {
        // allExpands(): ISupportedGames[] {
        //     let a = getAllExpands();
        //     console.log(a);
        //     return a;
        // }
    },

    actions: {

    }
})