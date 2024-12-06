<script lang='ts' setup>
import { ipcRenderer } from 'electron'
import { ElMessage } from 'element-plus';

const download = useDownload()
const settings = useSettings()

const form = ref<IDownloadTask>({
    webId: '',
    from: 'GlossMod',
    modWebsite: '',
    name: '',
    fileName: '',
    version: '',
    link: '',
    modAuthor: '',
    tags: [] as ITag[],
} as IDownloadTask)

const types = ref([
    //  "GlossMod", "NexusMods", "Thunderstore", "ModIo", "SteamWorkshop", "CurseForge", "GitHub", "GameBanana", "Customize"
    { label: 'GlossMod', value: 'GlossMod' },
    { label: 'NexusMods', value: 'NexusMods', disabled: true },
    { label: 'Thunderstore', value: 'Thunderstore' },
    { label: 'ModIo', value: 'ModIo' },
    { label: 'SteamWorkshop', value: 'SteamWorkshop', disabled: true },
    { label: 'CurseForge', value: 'CurseForge' },
    { label: 'GitHub', value: 'GitHub' },
    { label: 'GameBanana', value: 'GameBanana' },
    { label: '自定义', value: 'Customize' }
])

const editingProhibited = ref(true)

async function parsing() {
    /**
     * https://mod.3dmgame.com/mod/213993
     * https://thunderstore.io/package/rob_gaming/Belmont/
     * https://mod.io/g/baldursgate3/m/kays-hair-mod
     * https://www.curseforge.com/minecraft/texture-packs/short-swords-pack
     * https://gamebanana.com/mods/560006
     * https://github.com/BepInEx/BepInEx
     */
    console.log(form.value.modWebsite);
    let url = form.value.modWebsite
    let type: sourceType

    if (!url) {
        ElMessage.error('请输入要解析的网址')
        return
    }

    if (url.includes('mod.3dmgame.com')) {
        type = 'GlossMod';
        let id = url.split('/').pop()

        let data = await ipcRenderer.invoke("get-mod-data", { id })
        console.log(data);
        form.value.name = data.name

    } else if (url.includes('thunderstore.io')) {
        type = 'Thunderstore';
    } else if (url.includes('mod.io')) {
        type = 'ModIo';
    } else if (url.includes('curseforge.com')) {
        type = 'CurseForge';
    } else if (url.includes('gamebanana.com')) {
        type = 'GameBanana';
    } else if (url.includes('github.com')) {
        type = 'GitHub';
    } else {
        type = 'Customize';
    }

    form.value.from = type;
    console.log(`Parsed type: ${type}`)

    editingProhibited.value = false
}

</script>
<template>
    <v-chip append-icon="mdi-plus" @click="download.showAddTaskDialog = !download.showAddTaskDialog" label
        variant="text"> 新建下载</v-chip>
    <el-dialog v-model="download.showAddTaskDialog" draggable :close-on-click-modal="false" append-to-body
        width="900px">
        <template #header>
            <div class="text"> 新建下载 </div>
        </template>
        <!-- <el-card> -->
        <el-form label-width="120" v-model="form">
            <el-form-item label="网址">
                <el-input v-model="form.modWebsite" placeholder="输入Mod地址, 然后点击解析">
                    <template #append>
                        <el-button @click="parsing">解析</el-button>
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item label="来源">
                <!-- <el-input v-model="form.type" disabled></el-input> -->
                <el-select v-model="form.from" :disabled="editingProhibited">
                    <el-option v-for="item in types" :key="item.value" :label="item.label" :value="item.value"
                        :disabled="item.disabled" />
                </el-select>
            </el-form-item>
            <el-form-item label="Mod名称" :disabled="editingProhibited">
                <el-input v-model="form.name" :disabled="editingProhibited"></el-input>
            </el-form-item>
            <el-form-item label="文件名" :disabled="editingProhibited">
                <el-input v-model="form.fileName" :disabled="editingProhibited"></el-input>
            </el-form-item>
            <el-form-item label="版本" :disabled="editingProhibited">
                <el-input v-model="form.version" :disabled="editingProhibited"></el-input>
            </el-form-item>
            <el-form-item label="下载链接">
                <el-input v-model="form.link" :disabled="editingProhibited"></el-input>
            </el-form-item>
            <el-form-item label="作者">
                <el-input v-model="form.modAuthor" :disabled="editingProhibited"></el-input>
            </el-form-item>
            <el-form-item label="标签">
                <!-- <el-input-tag v-model="form.modTags" placeholder="Please input"
                    aria-label="Please click the Enter key after input" /> -->
            </el-form-item>
            <el-form-item label="Mod类型" v-if="settings.settings.managerGame">
                <el-select v-model="form.modType">
                    <el-option v-for="item in settings.settings.managerGame?.modType" :key="item.id" :label="item.name"
                        :value="item.id" />
                </el-select>
            </el-form-item>
        </el-form>
        <v-card-actions>
            <v-btn color="primary" @click="download.addDownloadTask(form)">确定</v-btn>
            <v-btn @click="download.showAddTaskDialog = false">取消</v-btn>
        </v-card-actions>
        <!-- </el-card> -->
    </el-dialog>
</template>
<script lang='ts'>

export default {
    name: 'DownloadAddTask',
}
</script>
<style lang='less' scoped></style>