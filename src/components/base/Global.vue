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

const settings = useSettings()
const download = useDownload()
const manager = useManager()
const { locale } = useI18n()

Config.initialization()
download.initialization()
AppAnalytics.sendEvent("start")

// 初始化设置
watch(() => settings.settings, () => {
    Config.setConfig(settings.settings)
}, { deep: true })

// 初始化下载
watch(() => download.downloadTaskList, () => {
    download.saveTaskConfig()
}, { deep: true })

// 初始化语言
watch(() => settings.settings.language, () => {
    locale.value = settings.settings.language
}, { immediate: true })

// 初始化Mod管理
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

// 处理 .gmm 文件打开 
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

</script>
<template></template>
<script lang='ts'>

export default {
    name: 'Global',
}
</script>
<style lang='less' scoped></style>