<script lang='ts' setup>
import { useSettings } from "@src/stores/useSettings";
import { useManager } from '@src/stores/useManager';
import { watch, onMounted } from "vue";
import { Config } from '@src/model/Config'
import { useDownload } from "@src/stores/useDownload";
import { useI18n } from "vue-i18n";
import { AppAnalytics } from "@src/model/Analytics"
import { ipcRenderer } from 'electron'
import { FileHandler } from '@src/model/FileHandler'
import { useTheme } from 'vuetify'

const settings = useSettings()
const download = useDownload()
const manager = useManager()
const { locale } = useI18n()

Config.initialization()
download.initialization()
AppAnalytics.sendEvent("start")

//#region  初始化设置
watch(() => settings.settings, () => {
    Config.setConfig(settings.settings)
}, { deep: true })

//#endregion

//#region 初始化下载
watch(() => download.downloadTaskList, () => {
    download.saveTaskConfig()
}, { deep: true })
//#endregion

//#region 初始化语言
watch(() => settings.settings.language, () => {
    locale.value = settings.settings.language
}, { immediate: true })
//#endregion

//#region 初始化Mod管理
if (manager.managerModList.length == 0 && settings.settings.managerGame) {
    manager.getModInfo().then(() => {
        manager.maxID = manager.managerModList.reduce((pre, cur) => {
            return pre > cur.id ? pre : cur.id
        }, 0)
        console.log(manager.maxID);

    })
}
watch(() => manager.managerModList, () => {
    manager.saveModInfo()
}, { deep: true })
//#endregion

//#region 处理 .gmm 文件打开 
ipcRenderer.on('open-gmm-file', (_, args) => {
    console.log(args);
    let path = args[args.length - 1]
    // console.log(path);  // gmm://installmod/?id=172999&game=185&name=只狼：影逝二度

    // 判断是否是 gmm://installmod 开头
    if (path.startsWith("gmm://installmod")) {
        download.addDownloadByWeb(path)
    } else if (FileHandler.fileExists(path)) {
        manager.addModByGmm(path)
    }
})
//#endregion

//#region 主题

const theme = useTheme()


watch(() => settings.settings.theme, () => {
    setHtmlClass()
}, { immediate: true })

// 监听系统主题变化
onMounted(() => {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (settings.settings.theme == "system") {
            if (e.matches) {
                setDarkTheme()
            } else {
                setLightTheme()
            }
        }
    })
})

// console.log(settings.settings.theme);


function setHtmlClass() {
    switch (settings.settings.theme) {
        case "system":
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                setDarkTheme()
            } else {
                setLightTheme()
            }
            break;
        case 'dark':
            setDarkTheme()
            break;
        case 'light':
            setLightTheme()
            break;
        default:
            break;
    }
}

function setDarkTheme() {
    let html = document.querySelector("html")
    html?.classList.add("dark")
    theme.global.name.value = "dark"
}

function setLightTheme() {
    let html = document.querySelector("html")
    html?.classList.remove("dark")
    theme.global.name.value = "light"
}

//#endregion



</script>
<template></template>
<script lang='ts'>

export default {
    name: 'Global',
}
</script>
<style lang='less' scoped></style>