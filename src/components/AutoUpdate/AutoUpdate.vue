<script lang='ts' setup>
import { useMain } from '@src/stores/useMain';
import { ref } from "vue";
import marked from '@src/plugins/marked';

import Updating from '@src/components/AutoUpdate/Updating.vue'

const main = useMain()



//#region 判断是否是最新版本
let dialog = ref(false)
let Version = ref()
let data = ref()
let updateContent = ref("")
let haveUpdate = ref(false)

// 检查版本是否为最新
function isLatestVersion(currentVersion: string, latestVersion: string): boolean {
    const [curMajor, curMinor, curPatch] = currentVersion.split(".");
    const [latMajor, latMinor, latPatch] = latestVersion.split(".");
    if (
        Number(latMajor) > Number(curMajor) ||
        (Number(latMajor) === Number(curMajor) && Number(latMinor) > Number(curMinor)) ||
        (Number(latMajor) === Number(curMajor) &&
            Number(latMinor) === Number(curMinor) &&
            Number(latPatch) > Number(curPatch))
    ) {
        return false;
    }
    return true;
}

// 检查更新
async function checkUpdates() {
    Version.value = await main.getVersion()
    data.value = Version.value[1]
    if (!isLatestVersion(Version.value[0], data.value.mods_version)) {
        haveUpdate.value = true
        dialog.value = true
        let mods_content = data.value.mods_content
        // 获取字符串 ### 更新日志 之后的内容
        let index = mods_content.indexOf('### 更新日志')
        updateContent.value = mods_content.substring(index + 8)
    }
}
checkUpdates()


//#endregion


//#region 开始更新

let updateing = ref(false)

function toUpdate() {
    updateing.value = true
}

//#endregion

</script>
<template>
    <v-list-item v-if="haveUpdate" @click="dialog = true" prepend-icon="mdi-refresh"></v-list-item>
    <v-dialog v-model="dialog" persistent width="600">
        <v-card>
            <v-card-title>{{ $t('New version') }}</v-card-title>
            <v-card-text>
                <v-row>
                    <v-col cols="6">{{ `${$t('Current version')} : ${Version[0]}` }}</v-col>
                    <v-col cols="6">{{ `${$t('Latest version')} : ${data.mods_version}` }}</v-col>
                    <v-col cols="12" v-if="!updateing">
                        <h3>{{ $t('Update log') }}</h3>
                        <div class="markdown-body" v-html="marked(updateContent)"></div>
                    </v-col>
                    <v-col cols="12" v-else>
                        <Updating></Updating>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions class="btn">
                <v-btn variant="text" @click="dialog = false">{{ $t('Cancel') }}</v-btn>
                <v-btn variant="text" @click="toUpdate">{{ $t('Update') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang='ts'>

export default {
    name: 'AutoUpdate',
}
</script>
<style lang='less' scoped>
.markdown-body {
    background-color: transparent;
    max-height: 200px;
    overflow: auto;
    margin-top: 1rem;
}

.btn {
    display: flex;
    justify-content: flex-end;
}
</style>