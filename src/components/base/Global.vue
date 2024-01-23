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
import { APIAria2 } from "@src/model/APIAria2";
import { Expands } from "@src/model/Expands"

const settings = useSettings()
const download = useDownload()
const manager = useManager()
const { locale } = useI18n()



APIAria2.init()             // 初始化 Aria2
Expands.init()              // 初始化扩展
Config.initialization()     // 初始化配置
download.initialization()   // 初始化下载
AppAnalytics.sendEvent("start")

console.log(`正在初始化.`);
console.log("当前配置目录:", Config.configFolder());
console.log("我的文档位置:", FileHandler.getMyDocuments());


//#region  初始化设置
watch(() => settings.settings, () => {
    Config.setConfig(settings.settings)
    GetModInfo()
}, { deep: true })

if (!settings.settings.managerGameList) {
    settings.settings.managerGameList = []
}

//#endregion

//#region 初始化下载
watch(() => download.downloadTaskList, () => {
    download.saveTaskConfig()
    console.log(`当前下载缓存目录: ${settings.settings.modStorageLocation}\\cache`);
}, { deep: true })


//#endregion

//#region 初始化语言
watch(() => settings.settings.language, () => {
    locale.value = settings.settings.language
    console.log(`当前语言: ${settings.settings.language}`);
}, { immediate: true })

//#endregion

//#region 初始化Mod管理
GetModInfo()
watch(() => manager.managerModList, () => {
    manager.saveModInfo()
}, { deep: true })

watch(() => manager.tags, () => {
    manager.savaTagsList()
}, { deep: true })

function GetModInfo() {
    // manager.managerModList.length == 0 && settings.settings.managerGame
    if (settings.settings.managerGame) {
        manager.getModInfo().then(() => {
            // 移除 manager.managerModList 中为 null 的值
            manager.managerModList = manager.managerModList.filter((item) => {
                return item != null
            })
            manager.maxID = manager.managerModList.reduce((pre, cur) => {
                return pre > cur?.id ? pre : cur?.id
            }, 0)
            console.log(`Mod 最大ID : ${manager.maxID}`);

            // 检查Mod更新
            manager.checkAllModUpdate()
        })
        manager.getTagsList().then(() => {
            // 移除 manager.tags 中为 null 的值
            manager.tags = manager.tags.filter((item) => {
                return item != null
            })
        })
    }
}


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
    console.log(`当前主题: ${settings.settings.theme}`);

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