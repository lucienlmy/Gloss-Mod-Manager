<script lang='ts' setup>
import { useSettings } from '@src/stores/useSettings';
// import { Download } from "@src/model/Download"
import { ref, watch, reactive } from 'vue';
import DownloadTasks from '@src/components/Download/Tasks.vue'
// import { DownloadStatus } from '@src/model/Interfaces';
import { useMain } from '@src/stores/useMain';
import { useDownload } from '@src/stores/useDownload';
import { ElMessage } from 'element-plus';
import { FileHandler } from '@src/model/FileHandler'
import { Unzipper } from "@src/model/Unzipper"
import { dirname, join } from "node:path"
// import { spawn } from 'child_process';

const settings = useSettings()
const download = useDownload()
const main = useMain()

let begin = ref(false)
let task = reactive({
    id: 197445,
    name: "Gloss Mod Manager",
    version: main.webVersion.mods_version,
    status: "waiting" as "active" | "waiting" | "paused" | "error" | "complete" | "removed",
    speed: 0,
    totalSize: 0,
    downloadedSize: 0,
    link: main.webVersion.mods_resource_url,
    modAuthor: main.webVersion.mods_author,
    gid: ""
})
let dest = join(settings.settings.modStorageLocation, 'cache', 'update')

console.log('dest', dest);


async function updata() {
    FileHandler.deleteFile(join(dest, `${task.id}.zip`))
    let gid = await download.aria2.addUri(task.link, `${task.id}.zip`, dest)
    task.gid = gid.result
    begin.value = true
}

watch(() => task.status, (status) => {
    if (status == "complete") {
        autoInstall()
    }
})

function autoInstall() {
    main.sleep(3000).then(async () => {
        ElMessage.success(`开始安装`)
        let folder = dest
        await Unzipper.unzip(join(dest, `${task.id}.zip`), folder)
        await FileHandler.renameFile(`${folder}\\Gloss Mod Manager.exe`, `${folder}\\Gloss Mod Manager_${main.webVersion.mods_version}.exe`)
        let exe = `${folder}\\Gloss Mod Manager_${main.webVersion.mods_version}.exe`
        console.log(exe);
        // spawn(exe, [])
        FileHandler.runExe(exe)
    })
}

updata()

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