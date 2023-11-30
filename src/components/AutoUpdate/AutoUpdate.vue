<script lang='ts' setup>
import { ipcRenderer } from "electron";
import { ElMessage, ElNotification } from "element-plus";

ipcRenderer.invoke('check-for-updates')

ipcRenderer.on('checking-for-update', (event, data) => {
    console.log("开始检查更新")
})
ipcRenderer.on('update-available', (event, data) => {
    console.log("有新版本可用", data.version)
})
ipcRenderer.on('update-not-available', (event, data) => {
    console.log("已经是最新版本", data.version)
})
ipcRenderer.on('update-error', (event, data) => {
    console.log(`检查更新失败`, data)
})
ipcRenderer.on('update-downloaded', (event, data) => {
    console.log(`更新下载完成, 请重启应用`, data.version)
    // ElMessage.success(`${data.version} 版本已下载完成, 将在退出后自动更新.`)
    ElNotification.success({
        title: '新版本可用',
        message: `${data.version} 版本已下载完成, 点击开始更新, 或稍后自动更新.`,
        // message: `新版本已下载完成, 点击开始更新, 或稍后自动更新.`,
        offset: 60,
        duration: 0,
        onClick: () => {
            ipcRenderer.invoke('install-update-and-restart')
        }
    })
})


</script>
<template></template>
<script lang='ts'>

export default {
    name: 'AutoUpdate',
}
</script>
<style lang='less' scoped></style>