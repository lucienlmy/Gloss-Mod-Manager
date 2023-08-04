import { defineStore } from "pinia";
import type { ISettings } from "@src/model/Interfaces";
import { Config } from '@src/model/Config'


export const useSettings = defineStore('Settings', {
    state: () => ({
        settings: {} as ISettings,
        langList: [
            { text: "简体中文", value: 'zh_CN' },
            { text: "English", value: 'en_US' },
            { text: "Turkish by:sinnerclown", value: 'tr_TR' },
        ],

    }),
    getters: {
        configFile: () => Config.configFile(),
    },
    actions: {

    }
})