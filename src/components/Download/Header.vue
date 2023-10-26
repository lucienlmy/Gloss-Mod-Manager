<script lang='ts' setup>
import { useDownload } from '@src/stores/useDownload';
// import { APIAria2 } from '@src/model/APIAria2'
// import { useSettings } from '@src/stores/useSettings';
// import { join } from 'node:path'

const download = useDownload()
// const settings = useSettings()


// let status = ''

// async function test() {
//     let url = "https://mod.3dmgame.com/static/upload/resource2/202310/9688990_20231017152110_69661.zip"
//     // download.aria2.addUri(url, '测试.zip', join(settings.settings.modStorageLocation, 'cache')).then((gid: any) => {
//     //     console.log(`Added download task: ${gid.result}`);
//     //     download.aria2.onProgress(gid.result).then((result: any) => {
//     //         console.log(result)
//     //     })
//     // })
//     let gid = await download.aria2.addUri(url, '测试.zip', join(settings.settings.modStorageLocation, 'cache'))

//     // 每秒获取一次进度
//     let timer = setInterval(async () => {
//         let result = await download.aria2.onProgress(gid.result)
//         console.log(result)
//         if (result.result.status != "active") {
//             clearInterval(timer)
//         }
//     }, 1000)
// }

</script>
<template>
    <v-app-bar :elevation="0">
        <v-container fluid>
            <v-row class="header">
                <v-col cols="12">
                    <v-chip-group v-model="download.tab" mandatory>
                        <v-chip label variant="text" :value="'all'">{{ $t('All') }}</v-chip>
                        <v-chip label variant="text" :value="'active'">{{ $t('Downloading') }}</v-chip>
                        <v-chip label variant="text" :value="'paused'">{{ $t('Paused') }}</v-chip>
                        <v-chip label variant="text" :value="'complete'">{{ $t('Completed') }}</v-chip>
                        <v-chip label variant="text" :value="'error'">{{ $t('Waiting/Failure') }}</v-chip>
                    </v-chip-group>
                    <!-- <v-chip label variant="text" @click="test">测试</v-chip> -->
                </v-col>
            </v-row>
        </v-container>
    </v-app-bar>
</template>
<script lang='ts'>

export default {
    name: 'DownloadHeader',
}
</script>
<style lang='less' scoped></style>