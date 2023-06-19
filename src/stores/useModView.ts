import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import type { IMod } from "@src/model/Interfaces";

export const useModView = defineStore('ModView', {
    state: () => ({
        mod: null as IMod | null,
        id: 0
    }),

    actions: {
        GetModData() {
            ipcRenderer.send("get-mod-data", {
                id: this.id
            })
        },
    }
})