<script lang='ts' setup>
import { useSettings } from "@src/stores/useSettings";
import { useManager } from '@src/stores/useManager';
import { watch } from "vue";
import { Config } from '@src/model/Config'
import { useDownload } from "@src/stores/useDownload";
import AutoUpdate from "@src/components/AutoUpdate/AutoUpdate.vue"
import { useI18n } from "vue-i18n";

const settings = useSettings()
const download = useDownload()
const manager = useManager()
const { locale } = useI18n()

Config.initialization()
download.initialization()

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
if (manager.managerModList.length == 0) {
    manager.getModInfo().then(() => {
        manager.maxID = manager.managerModList.reduce((pre, cur) => {
            return pre > cur.id ? pre : cur.id
        }, 0)
    })
}
watch(() => manager.managerModList, () => {
    manager.saveModInfo()
}, { deep: true })

console.log(manager.maxID);


</script>
<template>
    <AutoUpdate></AutoUpdate>
</template>
<script lang='ts'>

export default {
    name: 'Global',
}
</script>
<style lang='less' scoped></style>