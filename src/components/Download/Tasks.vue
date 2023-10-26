<script lang='ts' setup>
// import { Download } from '@src/model/Download';
import { FileHandler } from '@src/model/FileHandler';
import type { IDownloadTask } from '@src/model/Interfaces';
// import { DownloadStatus } from '@src/model/Interfaces';
import { useDownload } from '@src/stores/useDownload';
import { useMain } from '@src/stores/useMain';
import { useSettings } from '@src/stores/useSettings';
import { extname, join } from "node:path";
import { computed } from "vue";
import { h, ref } from 'vue'
import { ElMessage, ElMessageBox, ElSwitch } from 'element-plus'
import { useManager } from '@src/stores/useManager';
import { useI18n } from "vue-i18n"

const props = defineProps<{
    task: IDownloadTask,
    isUpdate?: boolean
}>()
const main = useMain()
const settings = useSettings()
const download = useDownload()
const manager = useManager()
const { t } = useI18n()

const modStorage = computed(() => join(settings.settings.modStorageLocation, 'cache', `${props.task.id}${extname(props.task.link)}`))
const progress = computed(() => {
    return Math.floor(props.task.downloadedSize / props.task.totalSize * 10000) / 100; // 计算下载进度
})


// if (props.task.gid) {
console.log(props.task.gid);
// 每秒获取一次进度
let timer = setInterval(onProgress, 100)

// 下载进度
async function onProgress() {
    let { result } = await download.aria2.onProgress(props.task.gid!)
    // console.log(props.task.gid, result.status);

    if (!result) {
        clearInterval(timer)
        return
    }

    if (result.gid == props.task.gid) {
        if (props.task.status != "complete" && result.status == "complete") {
            ElMessage.success(`${props.task.name} 下载完成`)
            if (settings.settings.autoInstall && !props.isUpdate) {
                install()
            }
        }

        props.task.status = result.status
        props.task.speed = result.downloadSpeed
        props.task.totalSize = result.totalLength
        props.task.downloadedSize = result.completedLength

        if (result.status == "paused" || result.status == "error" || result.status == "removed") {
            clearInterval(timer)
        }
    }
}




let delFile = ref(true)

// 删除
function del() {
    ElMessageBox({
        title: t("Delete task?"),
        // Should pass a function if VNode contains dynamic props
        message: () => h(ElSwitch, {
            modelValue: delFile.value,
            'onUpdate:modelValue': (val: boolean | string | number) => {
                delFile.value = val as boolean
            },
            'inactive-text': t("Delete local files")
        }),
    }).then(() => {
        if (delFile.value) {
            FileHandler.deleteFile(modStorage.value)
            FileHandler.deleteFile(`${modStorage.value}.downloaded`)
        }
        pause()
        download.downloadTaskList.splice(download.downloadTaskList.findIndex(item => item.id == props.task.id), 1)
    }).catch(() => { })
}

// 继续
async function start() {
    if (props.task.gid) {
        let result = await download.aria2.unpause(props.task.gid)
        console.log(result);
        // 继续 timer
        timer = setInterval(onProgress, 100)
    }
}

// 暂停
async function pause() {
    if (props.task.gid) {
        let { result } = await download.aria2.pause(props.task.gid)
        console.log(result);
    }
}

// 重新下载
function restart() {
    FileHandler.deleteFile(modStorage.value)
    download.addDownloadById(props.task.id)
}
function openWeb() {
    window.open(`https://mod.3dmgame.com/mod/${props.task.id}`)
}
function openFile() {
    FileHandler.openFolder(modStorage.value)
}
function install() {
    if (extname(props.task.link) == '.gmm') {
        let file = join(settings.settings.modStorageLocation, 'cache', `${props.task.id}.gmm`)
        manager.addModByGmm(file)
    } else {
        // console.log('downloadProcess', downloadProcess);
        manager.addModByTask(props.task)
    }
}
</script>
<template>
    <v-card class="task">
        <v-card-text>
            <v-row>
                <v-col cols="6" md="8" class="name">{{ task.name }}</v-col>
                <v-col cols="6" md="4" class="operation" v-if="task.status">
                    <v-btn variant="text" :title="t('Start')" v-if="['error', 'waiting', 'paused'].includes(task.status)"
                        @click="start()">
                        <v-icon>mdi-menu-right</v-icon>
                    </v-btn>
                    <v-btn variant="text" :title="t('Pause')" v-if="['active'].includes(task.status)" @click="pause()">
                        <v-icon>mdi-pause</v-icon>
                    </v-btn>
                    <template v-if="!isUpdate">
                        <v-btn variant="text" :title="t('Redownload')" v-if="['complete'].includes(task.status)"
                            @click="restart">
                            <v-icon>mdi-restart</v-icon>
                        </v-btn>
                        <v-btn variant="text" :title="t('Delete')" @click="del">
                            <v-icon>mdi-trash-can-outline</v-icon>
                        </v-btn>
                        <v-btn variant="text" :itle="t('Install')" @click="install"
                            v-if="task.status == 'complete'"><v-icon>mdi-download</v-icon></v-btn>
                    </template>
                    <v-menu open-on-hover>
                        <template v-slot:activator="{ props }">
                            <v-btn variant="text" v-bind="props"><v-icon>mdi-menu</v-icon></v-btn>
                        </template>
                        <v-list>
                            <v-list-item append-icon="mdi-web" :title="t('Open website')" @click="openWeb"> </v-list-item>
                            <v-list-item append-icon="mdi-zip-box-outline" :title="t('Open file')" @click="openFile"
                                :disabled="task.status !== 'complete'">
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12">
                    <v-progress-linear :model-value="progress" color="teal"></v-progress-linear>
                </v-col>
                <v-col cols="12" class="state">
                    <div class="left">
                        <!-- <div>{{ state }}</div> -->
                    </div>
                    <div class="right">
                        <div v-if="task.status == 'active'">{{ `${main.formatSiez(task.speed)}/s` }}</div>
                        <div v-else>{{ $t(task.status || '') }}</div>
                        <div>{{ `${main.formatSiez(task.downloadedSize)} / ${main.formatSiez(task.totalSize)}` }}</div>
                    </div>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'DownloadTasks',
}
</script>
<style lang='less' scoped>
.task {

    .name {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .operation {
        text-align: right;
    }

    .state {
        display: flex;
        justify-content: space-between;

        .right {
            display: flex;

            &>div {
                margin-left: 10px;
            }
        }


    }
}
</style>