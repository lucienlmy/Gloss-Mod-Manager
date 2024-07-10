<script lang='ts' setup>
import { useDownload } from '@src/stores/useDownload';
import { useGithub } from '@src/stores/useGithub';

const download = useDownload()
const github = useGithub()

function toDownload() {
    download.addDownloadByGitHub(github.selectAsset, github.version, github.website)
    download.showAddTaskDialog = false
}

</script>
<template>
    <v-card-text>
        <v-col cols="12">
            <el-form :model="download.form" label-width="120px">
                <el-form-item label="GitHub地址">
                    <el-input v-model="github.url" placeholder="eg: https://github.com/praydog/REFramework">
                        <template #append>
                            <v-btn variant="text" size="small" append-icon="mdi-chart-arc"
                                @click="github.parse(github.url)" :loading="github.loading">解析</v-btn>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item v-if="github.assets && github.assets.length > 0">
                    <v-chip-group v-model="github.selectAsset">
                        <v-chip v-for="item in github.assets" label :value="item">{{ item.name }}</v-chip>
                    </v-chip-group>
                </el-form-item>
                <el-form-item label="ID">
                    <el-input v-model="github.selectAsset.id" disabled />
                </el-form-item>
                <el-form-item label="名称">
                    <el-input v-model="github.selectAsset.name" disabled />
                </el-form-item>
                <el-form-item label="下载地址">
                    <el-input v-model="github.selectAsset.browser_download_url" disabled />
                </el-form-item>
            </el-form>
        </v-col>
    </v-card-text>
    <v-card-actions v-if="github.selectAsset.browser_download_url" class="actions">
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
    name: 'AddTaskGitHub',
}
</script>
<style lang='less' scoped>
.actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
</style>