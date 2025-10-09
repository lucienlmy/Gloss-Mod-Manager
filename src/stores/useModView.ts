import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import { _3DMApi } from "@/model/_3DMApi";
export const useModView = defineStore("ModView", {
    state: () => ({
        mod: null as IMod | null,
        id: 0,
    }),

    actions: {
        GetModData() {
            _3DMApi.getModData(this.id);
        },
    },
});
