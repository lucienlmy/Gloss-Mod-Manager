<script lang='ts' setup>
import { Download } from '@src/model/Download';
import { FileHandler } from '@src/model/FileHandler';
import { IDownloadTask, DownloadStatus } from '@src/model/Interfaces';
import { useDownload } from '@src/stores/useDownload';
import { useMain } from '@src/stores/useMain';
import { useSettings } from '@src/stores/useSettings';
import { extname } from "node:path";
import { computed } from "vue";
import { h, ref } from 'vue'
import { ElMessageBox, ElSwitch } from 'element-plus'
import { useManager } from '@src/stores/useManager';

const props = defineProps<{
    task: IDownloadTask
}>()
const main = useMain()
const settings = useSettings()
const download = useDownload()
const manager = useManager()

const state = computed(() => {
    switch (props.task.state) {
        case 0:
            return "等待中"
            break;
        case 1:
            return "下载中"
            break;
        case 2:
            return "暂停"
            break;
        case 3:
            return "完成"
            break;

        default:
            return "未知"
            break;
    }
})

const progress = computed(() => {
    return Math.floor(props.task.downloadedSize / props.task.totalSize * 10000) / 100; // 计算下载进度
})
const modStorage = computed(() => `${settings.settings.modStorageLocation}\\cache\\${props.task.id}${extname(props.task.link)}`)

let downloadProcess = download.downloadProcessList.find(item => item.id == props.task.id) as Download | undefined

if (!downloadProcess) {
    downloadProcess = new Download(props.task, modStorage.value, download.listen(props.task).onProgress)
    download.downloadProcessList.push(downloadProcess)
}





let delFile = ref(false)

function del() {
    ElMessageBox({
        title: '删除任务?',
        // Should pass a function if VNode contains dynamic props
        message: () => h(ElSwitch, {
            modelValue: delFile.value,
            'onUpdate:modelValue': (val: boolean | string | number) => {
                delFile.value = val as boolean
            },
            'inactive-text': '同时删除本地文件'
        }),
    }).then(() => {
        if (delFile.value) {
            FileHandler.deleteFile(modStorage.value)
            FileHandler.deleteFile(`${modStorage.value}.downloaded`)
        }

        if (props.task.state == DownloadStatus.DOWNLOADING) {
            downloadProcess?.pause()
        }

        download.downloadTaskList.splice(download.downloadTaskList.findIndex(item => item.id == props.task.id), 1)
    }).catch(() => { })

}

function restart() {
    FileHandler.deleteFile(modStorage.value)
    downloadProcess?.start()
}
function openWeb() {
    window.open(`https://mod.3dmgame.com/mod/${props.task.id}`)
}
function openFile() {
    FileHandler.openFolder(modStorage.value)
}
function install() {
    // console.log('downloadProcess', downloadProcess);
    manager.addModByTask(props.task)
}
</script>
<template>
    <v-card class="task">
        <v-card-text>
            <v-row>
                <v-col cols="8" class="name">{{ task.name }}</v-col>
                <v-col cols="4" class="operation">
                    <v-btn variant="text" title="开始" v-if="[0, 2].includes(task.state)" @click="downloadProcess?.resume()">
                        <v-icon>mdi-menu-right</v-icon>
                    </v-btn>
                    <v-btn variant="text" title="暂停" v-if="[1].includes(task.state)" @click="downloadProcess?.pause()">
                        <v-icon>mdi-pause</v-icon>
                    </v-btn>
                    <v-btn variant="text" title="重新下载" v-if="[3].includes(task.state)" @click="restart">
                        <v-icon>mdi-restart</v-icon>
                    </v-btn>
                    <v-btn variant="text" title="删除" @click="del">
                        <v-icon>mdi-trash-can-outline</v-icon>
                    </v-btn>
                    <v-btn variant="text" title="安装" @click="install"
                        v-if="task.state == DownloadStatus.COMPLETED"><v-icon>mdi-download</v-icon></v-btn>
                    <v-menu open-on-hover>
                        <template v-slot:activator="{ props }">
                            <v-btn variant="text" v-bind="props"><v-icon>mdi-menu</v-icon></v-btn>
                        </template>
                        <v-list>
                            <v-list-item append-icon="mdi-web" title="打开网站" @click="openWeb"> </v-list-item>
                            <v-list-item append-icon="mdi-zip-box-outline" title="打开文件" @click="openFile"
                                :disabled="task.state !== DownloadStatus.COMPLETED">
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
                        <div>{{ state }}</div>
                    </div>
                    <div class="right">
                        <div>{{ `${main.formatSiez(task.speed)}/s` }}</div>
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