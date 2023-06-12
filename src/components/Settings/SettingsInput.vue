<script lang='ts' setup>
import { ipcRenderer } from "electron";
import { useSettings } from '@src/stores/useSettings';
import { ElMessage } from "element-plus";
import { watch } from "vue";

const settings = useSettings()

// 选择mod储存位置
function selectModStorageLocation() {
    ipcRenderer.invoke("select-file", {
        properties: ['openDirectory'],
        filters: []
    }).then((res: string[]) => {
        if (res.length > 0) {
            settings.settings.modStorageLocation = res[0]
        }
    })
}

watch(() => settings.settings.autoLaunch, () => {
    ipcRenderer.invoke("set-auto-launch", settings.settings.autoLaunch)
})



</script>
<template>
    <v-row>
        <v-col cols="12">
            <h3 class="title">{{ $t('Settings') }}</h3>
        </v-col>

        <v-col cols="12" md="6">
            <v-text-field :label="$t('Mod Folder')" v-model="settings.settings.modStorageLocation">
                <template v-slot:append-inner>
                    <v-btn variant="text" @click="selectModStorageLocation">{{ $t('Select') }}</v-btn>
                </template>
            </v-text-field>
        </v-col>
        <v-col cols="12" md="6">
            <!-- <v-text-field clearable label="代理地址" v-model="settings.settings.proxy"
                placeholder="例如:http://127.0.0.1:10809 不使用请留空,乱填将导致无法联网"> </v-text-field> -->
            <v-select variant="solo" :label="$t('Language')" v-model="settings.settings.language" :items="settings.langList"
                item-title="text" item-value="value"></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="4">
            <v-switch :label="$t('Auto install for download')" color="#039BE5"
                v-model="settings.settings.autoInstall"></v-switch>
        </v-col>
        <v-col cols="12" sm="6" md="4">
            <v-switch :label="$t('Auto start for windows')" color="#039BE5"
                v-model="settings.settings.autoLaunch"></v-switch>
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'SettingsInput',
}
</script>
<style lang='less' scoped></style>