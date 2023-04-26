import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import { ISettings } from "@src/model/Interfaces";
import { join } from 'node:path'
import { homedir } from "os";
import { readFileSync, writeFile, existsSync, writeFileSync, mkdirSync } from 'node:fs'


export const useSettings = defineStore('Settings', {
    state: () => ({
        settings: {} as ISettings,
    }),
    getters: {
        // 配置文件路径
        configFile() {
            const documents = join(homedir(), 'My Documents', 'Gloss Mod Manager')
            let configPath = join(documents, 'config.json');
            if (!existsSync(documents)) {
                mkdirSync(documents)
            }

            if (!existsSync(configPath)) {
                writeFileSync(configPath, '{}', 'utf8');
            }
            return configPath
        },

    },
    actions: {
        // 读取配置文件
        getConfig() {
            let config = readFileSync(this.configFile, 'utf-8')
            let settings: ISettings = JSON.parse(config)

            return {
                ...settings,
            }
        },
        // 保存配置文件
        setConfig() {
            // 移除响应式
            let settings: ISettings = JSON.parse(JSON.stringify(this.settings))

            settings = {
                managerGame: settings.managerGame,
                modStorageLocation: settings.modStorageLocation,
            }

            // 格式化存入文件
            const config = JSON.stringify(settings)
            writeFile(this.configFile, config, { encoding: 'utf-8', flag: 'w' }, function (err) {
                if (err) {
                    console.log(err)
                }
            })
        }
    }
})