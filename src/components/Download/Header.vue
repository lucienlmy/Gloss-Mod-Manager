<script lang='ts' setup>
import { useDownload } from '@src/stores/useDownload';
import { APIAria2 } from '@src/model/APIAria2'
import { useSettings } from '@src/stores/useSettings';
import { join } from 'node:path'

const download = useDownload()
const settings = useSettings()

// function test() {
//     let url = "https://mod.3dmgame.com/static/upload/resource2/202310/9688990_20231017152110_69661.zip"
//     download.aria2.addUri(url, '测试.zip', join(settings.settings.modStorageLocation, 'cache')).then((gid: any) => {
//         console.log(`Added download task: ${gid}`);
//         download.aria2.onProgress(gid.result).subscribe((progress) => {
//             console.log(progress);
//         });

//     })
//     // download.aria2.tellActive()
// }

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