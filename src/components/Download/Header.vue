<script lang='ts' setup>
import { useDownload } from '@src/stores/useDownload';

const download = useDownload()

</script>
<template>
    <v-row class="header">
        <v-col cols="12">
            <v-tabs v-model="download.tab">
                <v-tab :value="'all'">全部下载</v-tab>
                <v-tab :value="1">正在下载</v-tab>
                <v-tab :value="2">暂停</v-tab>
                <v-tab :value="3">已完成</v-tab>
                <v-tab :value="0">等待/失败</v-tab>
            </v-tabs>
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'DownloadHeader',
}
</script>
<style lang='less' scoped></style>