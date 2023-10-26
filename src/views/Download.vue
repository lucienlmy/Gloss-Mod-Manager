<script lang='ts' setup>
import { useDownload } from '@src/stores/useDownload';

import DownloadWrap from '@src/components/Download/Wrap.vue'
import { ElMessageBox, ElSwitch } from 'element-plus';
import { h, ref } from 'vue'
import { useSettings } from '@src/stores/useSettings';
import { FileHandler } from '@src/model/FileHandler'
import { useManager } from '@src/stores/useManager';

const download = useDownload()
const settings = useSettings()
const manager = useManager()


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

function allInstell() {
    download.downloadTaskList.forEach(item => {
        manager.addModByTask(item)
    })
}

</script>
<template>
    <v-app-bar :elevation="0">
        <v-container fluid>
            <v-row>
                <v-col cols="12" class="top">
                    <div class="left">
                        <h1>
                            {{ $t('Download Manager') }}
                            <small>({{ $t('{0} tasks', [download.downloadTaskList.length]) }})</small>
                        </h1>
                    </div>
                    <div class="right">
                        <v-text-field density="compact" variant="solo" :label="$t('Search task')"
                            append-inner-icon="mdi-magnify" single-line hide-details
                            v-model="download.searchName"></v-text-field>
                        <v-chip label variant="text" append-icon="mdi-folder-open-outline"
                            @click="openFolder">{{ $t('Open Folder') }}</v-chip>
                        <v-chip label variant="text" append-icon="mdi-download"
                            @click="allInstell">{{ $t('Add All') }}</v-chip>
                        <v-chip label variant="text" append-icon="mdi-trash-can-outline"
                            @click="allDel">{{ $t('Delete All') }}</v-chip>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </v-app-bar>
    <v-container fluid>
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
    align-items: center;
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
        align-items: center;
    }

}
</style>