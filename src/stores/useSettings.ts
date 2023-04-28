import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import { ISettings } from "@src/model/Interfaces";
import { Config } from '@src/model/Config'


export const useSettings = defineStore('Settings', {
    state: () => ({
        settings: {} as ISettings,
    }),
    getters: {
        configFile: () => Config.configFile()
    },
    actions: {

    }
})