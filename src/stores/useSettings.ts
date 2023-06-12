import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import { ISettings } from "@src/model/Interfaces";
import { Config } from '@src/model/Config'
import { LocalLang } from '@src/model/LocalLang'


export const useSettings = defineStore('Settings', {
    state: () => ({
        settings: {} as ISettings,
        langList: [
            { text: "简体中文", value: 'zh_CN' },
            { text: "English", value: 'en_US' },
        ],

    }),
    getters: {
        configFile: () => Config.configFile(),
    },
    actions: {

    }
})