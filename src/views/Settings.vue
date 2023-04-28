<script lang='ts' setup>
import { ipcRenderer } from "electron";
import { useSettings } from '@src/stores/useSettings';

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

</script>
<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <h1 class="title">软件设置</h1>
            </v-col>
            <v-col cols="12">
                <v-text-field label="Mod储存位置" v-model="settings.settings.modStorageLocation">
                    <template v-slot:append-inner>
                        <v-btn variant="text" @click="selectModStorageLocation">选择</v-btn>
                    </template>
                </v-text-field>
                <v-text-field clearable label="代理地址" v-model="settings.settings.proxy"
                    placeholder="例如:http://127.0.0.1:10809 不使用请留空,乱填将导致无法联网"> </v-text-field>
            </v-col>
            <v-col cols="12"></v-col>
        </v-row>
    </v-container>
</template>
<script lang='ts'>

export default {
    name: 'Settings',
}
</script>
<style lang='less' scoped>
.title {
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 1rem;
}
</style>