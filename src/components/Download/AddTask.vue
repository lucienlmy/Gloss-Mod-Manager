<script lang='ts' setup>
import { ref } from "vue";
import { useDownload } from '@src/stores/useDownload';
import { ElMessage } from "element-plus";
import { ipcRenderer } from "electron";

const download = useDownload()

let loading = ref(false)
let data: any

async function parse() {

    // download.form.url = https://mod.3dmgame.com/mod/204339
    // 从 url 中提取 id
    const url = download.form.url

    // 判断是否包含 mod.3dmgame.com
    if (!url.includes('mod.3dmgame.com')) {
        ElMessage.warning('请输入正确的地址')
        return
    }

    const id = url.split('/').pop()

    data = await ipcRenderer.invoke("get-mod-data", { id })
    data.mods_resource_url = data.mods_resource_url.replace("http://mod.3dmgame.com", "https://mod.3dmgame.com")

    // console.log(data);
    download.form.id = data.id
    download.form.name = data.mods_title
    download.form.link = data.mods_resource_url


}


function toDownload() {
    if (data) {
        download.showAddTaskDialog = false
        if (!data.mods_resource_url.includes("https://mod.3dmgame.com")) {
            window.open(`https://mod.3dmgame.com/mod/${data.id}?for=download`)
            return
        }
        download.addDownloadTask(data)
    }
}

</script>
<template>
    <v-dialog v-model="download.showAddTaskDialog" persistent width="900px">
        <template v-slot:activator="{ props }">
            <v-chip append-icon="mdi-plus" v-bind="props" label variant="text"> 新建下载</v-chip>
        </template>
        <v-card>
            <v-card-title>
                <v-col cols="12" class="top">
                    <div class="title">
                        <div class="text">
                            新建下载
                        </div>
                    </div>
                    <div class="close">
                        <v-chip label append-icon="mdi-close" @click="download.showAddTaskDialog = false"
                            variant="text">{{ $t('Close') }}</v-chip>
                    </div>
                </v-col>
            </v-card-title>
            <v-card-text>
                <v-col cols="12">
                    <v-chip-group v-model="download.addTaskTab" mandatory>
                        <v-chip label :value="0" variant="text">{{ $t('3DM Mods') }}</v-chip>
                        <!-- <v-chip label :value="1" variant="text">{{ $t('Customize') }}</v-chip> -->
                    </v-chip-group>
                </v-col>
                <v-col cols="12">
                    <el-form :model="download.form" label-width="120px">
                        <el-form-item label="Mod地址">
                            <el-input v-model="download.form.url" placeholder="eg: https://mod.3dmgame.com/mod/197445">
                                <template #append>
                                    <v-btn variant="text" size="small" append-icon="mdi-chart-arc" @click="parse"
                                        :loading="loading">解析</v-btn>
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item label="Mod ID">
                            <el-input v-model="download.form.id" disabled />
                        </el-form-item>
                        <el-form-item label="名称">
                            <el-input v-model="download.form.name" disabled />
                        </el-form-item>
                        <el-form-item label="下载地址">
                            <el-input v-model="download.form.link" disabled />
                        </el-form-item>
                    </el-form>
                </v-col>
            </v-card-text>
            <v-card-actions v-if="download.form.link" class="actions">
                <v-col cols="4">
                    <v-switch color="#039BE5" :label="$t('Auto install for download')" hide-details
                        v-model="download.autoInstall"></v-switch>
                </v-col>
                <v-col cols="2">
                    <v-btn @click="toDownload">下载</v-btn>
                </v-col>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang='ts'>

export default {
    name: 'DownloadAddTask',
}
</script>
<style lang='less' scoped>
.actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
</style>