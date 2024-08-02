<script lang='ts' setup>
import { useDownload } from '@src/stores/useDownload';
import { useCustomize } from '@src/stores/useCustomize'
import { ElMessage } from 'element-plus';

const download = useDownload()
const customize = useCustomize()

function toDownload() {

    if (customize.url && customize.name) {
        download.addDownloadByCustomize(customize.url, customize.name)
        download.showAddTaskDialog = false
    } else {
        ElMessage.warning('请填写下载地址和文件名称')
    }

}


</script>
<template>
    <v-card-text>
        <v-col cols="12">
            <el-form :model="download.form" label-width="120px">
                <el-form-item label="下载地址">
                    <el-input v-model="customize.url" />
                </el-form-item>
                <el-form-item label="文件名称">
                    <el-input v-model="customize.name" />
                </el-form-item>
            </el-form>
        </v-col>
    </v-card-text>
    <v-card-actions class="actions">
        <v-col cols="4">
            <v-switch color="#039BE5" :label="$t('Auto install for download')" hide-details
                v-model="download.autoInstall"></v-switch>
        </v-col>
        <v-col cols="2">
            <v-btn @click="toDownload">下载</v-btn>
        </v-col>
    </v-card-actions>
</template>

<script lang='ts'>
export default {
    name: 'Customize',
}
</script>
<style lang='less' scoped>
.actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
</style>