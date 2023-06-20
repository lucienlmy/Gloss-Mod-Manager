<script lang='ts' setup>
import { useSettings } from '@src/stores/useSettings';
import { Download } from "@src/model/Download"
import { ref, computed, reactive } from 'vue';
import DownloadTasks from '@src/components/Download/Tasks.vue'
import { DownloadStatus } from '@src/model/Interfaces';
import { useMain } from '@src/stores/useMain';
import { useDownload } from '@src/stores/useDownload';
import { ElMessage } from 'element-plus';
import { FileHandler } from '@src/model/FileHandler'
import { Unzipper } from "@src/model/Unzipper"
import { dirname } from "node:path"
import { spawn } from 'child_process';

const settings = useSettings()
const download = useDownload()
const main = useMain()

let begin = ref(false)

// download.downloadProcessList.

let task = reactive({
    id: 197445,
    name: "Gloss Mod Manager",
    version: main.web.mods_version,
    state: DownloadStatus.WAITING,
    speed: 0,
    totalSize: 0,
    downloadedSize: 0,
    link: main.web.mods_resource_url,
    modAuthor: main.web.mods_author
})

let dest = `${settings.settings.modStorageLocation}\\cache\\update\\${task.id}.zip`
FileHandler.deleteFile(dest)
let process = new Download(task, dest, (downloadedSize: number, totalSize: number, speed: number) => {
    // // 计算下载进度 并保留2位小数
    task.speed = speed
    task.totalSize = totalSize
    task.downloadedSize = downloadedSize
    // 状态
    task.state = DownloadStatus.DOWNLOADING

    if (downloadedSize >= totalSize) {
        ElMessage.success(`${task.name} 下载完成`)
        autoInstall()
    }
})

download.downloadProcessList.push(process)

process.start()

begin.value = true

function autoInstall() {
    main.sleep(3000).then(async () => {
        let folder = dirname(dest)
        await Unzipper.unzip(dest, folder)
        await FileHandler.renameFile(`${folder}\\Gloss Mod Manager.exe`, `${folder}\\Gloss Mod Manager_${main.web.mods_version}.exe`)
        let exe = `${folder}\\Gloss Mod Manager_${main.web.mods_version}.exe`
        console.log(exe);
        spawn(exe, [])
    })
}

</script>
<template>
    <v-row>
        <v-col cols="12">
            <DownloadTasks v-if="begin" :task="task" isUpdate></DownloadTasks>
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'Updating',
}
</script>
<style lang='less' scoped></style>