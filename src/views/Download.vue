<script lang='ts' setup>
import { useDownload } from '@src/stores/useDownload';

import DownloadWrap from '@src/components/Download/Wrap.vue'
import { ElMessageBox, ElSwitch } from 'element-plus';
import { h, ref } from 'vue'
import { useSettings } from '@src/stores/useSettings';
import { FileHandler } from '@src/model/FileHandler'

const download = useDownload()
const settings = useSettings()

let delFile = ref(false)

function allDel() {
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
            const modStorage = `${settings.settings.modStorageLocation}\\cache`
            FileHandler.deleteFolder(modStorage)
        }
        download.downloadTaskList = []
    }).catch(() => { })
}

function openFolder() {
    const modStorage = `${settings.settings.modStorageLocation}\\cache`
    FileHandler.openFolder(modStorage)
}

</script>
<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" class="top">
                <div class="left">
                    <h1>下载管理 <small>(共 {{ download.downloadTaskList.length }} 个任务)</small></h1>
                </div>
                <div class="right">
                    <v-text-field density="compact" variant="solo" label="搜索任务" append-inner-icon="mdi-magnify" single-line
                        hide-details v-model="download.searchName"></v-text-field>
                    <v-btn variant="text" append-icon="mdi-trash-can-outline" @click="openFolder">打开文件夹</v-btn>
                    <v-btn variant="text" append-icon="mdi-trash-can-outline" @click="allDel">全部删除</v-btn>
                </div>
            </v-col>
        </v-row>
        <v-divider></v-divider>
        <DownloadWrap></DownloadWrap>
    </v-container>
</template>
<script lang='ts'>

export default {
    name: 'Download',
}
</script>
<style lang='less' scoped>
.top {
    display: flex;

    justify-content: space-between;

    .left {
        h1 {
            font-size: 1.2rem;

            small {
                opacity: 0.7;
            }
        }
    }

    .right {
        display: flex;
        flex: 1 1 auto;
    }

}
</style>