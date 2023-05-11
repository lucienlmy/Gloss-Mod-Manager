<script lang='ts' setup>
import { useSettings } from "@src/stores/useSettings";
import { watch } from "vue";
import { Config } from '@src/model/Config'
import { useDownload } from "@src/stores/useDownload";

const settings = useSettings()
const download = useDownload()

Config.initialization()
download.initialization()

watch(() => settings.settings, () => {
    Config.setConfig(settings.settings)
}, { deep: true })

watch(() => download.downloadTaskList, () => {
    download.saveTaskConfig()
}, { deep: true })

</script>
<template></template>
<script lang='ts'>

export default {
    name: 'Global',
}
</script>
<style lang='less' scoped></style>