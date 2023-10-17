<script lang='ts' setup>
import { useDownload } from '@src/stores/useDownload';
import { APIAria2 } from '@src/model/APIAria2'

const download = useDownload()


function test() {
    // let api = new APIAria2()
    APIAria2.init()
}

</script>
<template>
    <v-row class="header">
        <v-col cols="12">
            <v-chip-group v-model="download.tab" mandatory>
                <v-chip label variant="text" :value="'all'">{{ $t('All') }}</v-chip>
                <v-chip label variant="text" :value="1">{{ $t('Downloading') }}</v-chip>
                <v-chip label variant="text" :value="2">{{ $t('Paused') }}</v-chip>
                <v-chip label variant="text" :value="3">{{ $t('Completed') }}</v-chip>
                <v-chip label variant="text" :value="0">{{ $t('Waiting/Failure') }}</v-chip>
            </v-chip-group>
            <!-- <v-chip label variant="text" @click="test">测试</v-chip> -->
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'DownloadHeader',
}
</script>
<style lang='less' scoped></style>