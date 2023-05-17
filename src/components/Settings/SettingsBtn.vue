<script lang='ts' setup>
import { FileHandler } from '@src/model/FileHandler';
import { useMain } from '@src/stores/useMain';
import { ipcRenderer } from "electron";
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useSettings } from '@src/stores/useSettings';
import { join } from "node:path"
import { useDownload } from '@src/stores/useDownload';

const main = useMain()
const settings = useSettings()
const download = useDownload()

let cache = ref(0)
let cachePath = ref("")
ipcRenderer.invoke("get-system-path", "userData").then(async res => {
    cachePath.value = res
    cache.value = await FileHandler.getFileSize(res)
})

async function clearCache() {
    FileHandler.deleteFolder(cachePath.value)
    cache.value = await FileHandler.getFileSize(cachePath.value)
    ElMessage.success("清理缓存完成")
}


function openDownloadCache() {
    let downloadCachePath = join(settings.settings.modStorageLocation, "cache")
    FileHandler.openFolder(downloadCachePath)

}

function openGameFolder() {
    FileHandler.openFolder(settings.settings.managerGame.gamePath ?? "")
}

</script>
<template>
    <v-row>
        <v-col cols="12">
            <h3>{{ $t('Features') }}</h3>
        </v-col>
        <v-col cols="12">
            <v-chip label variant="text" append-icon="mdi-delete-clock-outline" @click="clearCache">
                {{ $t('Clean cache') }}
                <small>({{ main.formatSiez(cache) }})</small>
            </v-chip>
            <v-chip label variant="text" append-icon="mdi-folder-download-outline" @click="openDownloadCache">
                {{ $t('Open Download Folder') }}
            </v-chip>
            <v-chip label variant="text" v-if="settings.settings.managerGame" append-icon="mdi-folder-arrow-right-outline"
                @click="openGameFolder">{{ $t('Open Game Folder') }}</v-chip>
        </v-col>
        <v-col cols="12">
            <h3>{{ $t('Support') }}</h3>
        </v-col>
        <v-col cols="12">
            <!-- <v-btn variant="text"  ></v-btn> -->
            <v-chip variant="text" label append-icon="mdi-patreon"
                href="https://www.patreon.com/GlossModManager">Patreon</v-chip>
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'SettingsBtn',
}
</script>
<style lang='less' scoped></style>