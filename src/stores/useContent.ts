import { defineStore } from "pinia";
import { _3DMApi } from "@/model/_3DMApi";
export const useContent = defineStore("Content", {
    state: () => ({
        modData: null as IMod | null,
        loading: false,
    }),
    getters: {},
    actions: {
        async getModDataByID(id: number | string) {
            // get-mod-data
            this.loading = true;
            this.modData = await _3DMApi.getModData(id);
            this.loading = false;
            return this.modData;
        },
    },
});
