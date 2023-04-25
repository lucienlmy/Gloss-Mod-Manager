import { defineStore } from "pinia";

export const userMain = defineStore('Main', {
    state: () => ({
        leftMenu: true,
        leftMenuRail: true,
    }),
    actions: {

    }
})