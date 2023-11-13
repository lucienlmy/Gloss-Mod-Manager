<script lang='ts' setup>
import { FileHandler } from '@src/model/FileHandler';
import { useMain } from '@src/stores/useMain';
import { ipcRenderer } from "electron";
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useSettings } from '@src/stores/useSettings';
import { join } from "node:path"
import { useDownload } from '@src/stores/useDownload';
import { getLangAll } from '@src/lang'
import { LocalLang } from '@src/model/LocalLang'
import { useI18n } from 'vue-i18n';

const main = useMain()
const settings = useSettings()
const download = useDownload()
const { locale } = useI18n()

let langIsCn = computed(() => {
    // console.log(locale);
    return locale.value.includes("zh")
})


LocalLang.init()


function openDownloadCache() {
    let downloadCachePath = join(settings.settings.modStorageLocation, "cache")
    FileHandler.openFolder(downloadCachePath)

}

function openGameFolder() {
    FileHandler.openFolder(settings.settings.managerGame?.gamePath ?? "")
}

async function exportLang() {
    let allLang = await getLangAll()
    let langList = settings.langList
    FileHandler.writeFile(join(LocalLang.langFolder, "lang.json"), JSON.stringify(langList, null, 4))
    Object.keys(allLang).forEach(key => {
        FileHandler.writeFile(join(LocalLang.langFolder, `${key}.json`), JSON.stringify(allLang[key], null, 4))
    })
    ElMessage.success("导出完成~")
    FileHandler.openFolder(LocalLang.langFolder)
}



</script>
<template>
    <v-row>
        <v-col cols="12">
            <h3>{{ $t('Features') }}</h3>
        </v-col>
        <v-col cols="12">
            <!-- <v-chip label variant="text" append-icon="mdi-delete-clock-outline" @click="clearCache">
                {{ $t('Clean cache') }}
                <small>({{ main.formatSiez(cache) }})</small>
            </v-chip> -->
            <v-chip label variant="text" append-icon="mdi-folder-download-outline" @click="openDownloadCache">
                {{ $t('Open Download Folder') }}
            </v-chip>
            <v-chip label variant="text" v-if="settings.settings.managerGame" append-icon="mdi-folder-arrow-right-outline"
                @click="openGameFolder">{{ $t('Open Game Folder') }}</v-chip>
            <v-chip label variant="text" append-icon="mdi-export-variant"
                @click="exportLang">{{ $t('Export Language') }}</v-chip>
            <v-chip label variant="text">{{ `${$t('Current version')}: v${main.version}` }}</v-chip>
        </v-col>
        <v-col cols="12">
            <h3>{{ $t('Feedback') }}</h3>
        </v-col>
        <v-col cols="12">
            <v-chip variant="text" label append-icon="mdi-qqchat"
                href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=PHA9FOcayzFlxe0iU8QPWcHOy_NbBOdW&authKey=fgJvklKDg%2FeWXpG6rNDsPON7ls2omDWGJNZGGRT06QEcEDVjL%2BRLNLB7QFFPvBDL&noverify=0&group_code=825182128">
                {{ $t('QQChat') }}
            </v-chip>
            <v-chip v-if="!langIsCn" variant="text" label href="https://discord.gg/TF46tu7Upw">
                <template v-slot:append>
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="currentColor" class="bi bi-discord"
                        viewBox="0 0 16 16">
                        <path
                            d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />
                    </svg>
                </template>
                Discord </v-chip>
        </v-col>
        <!-- <v-col cols="12">
            <h3>{{ $t('Support') }}</h3>
        </v-col>
        <v-col cols="12">
            <v-chip variant="text" label append-icon="mdi-patreon"
                href="https://www.patreon.com/GlossModManager">Patreon</v-chip>
            <v-chip variant="text" label href="https://discord.gg/TF46tu7Upw">
                <template v-slot:append>
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="currentColor" class="bi bi-discord"
                        viewBox="0 0 16 16">
                        <path
                            d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />
                    </svg>
                </template>
                Discord </v-chip>
            <v-chip variant="text" label href="https://aoe.top/donate"
                append-icon="mdi-gift-outline">{{ $t('Feed Xiaom') }}</v-chip>
        </v-col> -->
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'SettingsBtn',
}
</script>
<style lang='less' scoped>
.bi {
    margin-left: 6px;
}
</style>