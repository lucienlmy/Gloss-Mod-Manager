<script lang='ts' setup>


const props = defineProps<{
    item: INexusMods
}>()

const settings = useSettings()
const download = useDownload()
const nexusmods = useNexusMods()
const { t } = useI18n()
const { formatSiez } = useMain()

const showDialog = ref(false)
const selectFile = ref<INexusModsFile>()
const filesList = ref<INexusModsFile[]>([])

const task = computed(() => {
    return download.getTaskById(props.item.modId)
})

const disabled = computed(() => {
    if (!settings.settings.managerGame) return true
    if (isDownloading.value) return true
    return false
})

const isDownloading = computed(() => {
    if (task.value) return true
    return false
})

const downloaded = computed(() => {
    if (task.value) {
        // console.log(task.value);
        // return task.value.progress
        return Math.floor(task.value.downloadedSize / task.value.totalSize * 10000) / 100; // 计算下载进度
    }
    return 0
})

const text = computed(() => {
    if (!settings.settings.managerGame) return t('Please manage the game first.')
    if (task.value && task.value.totalSize == task.value.downloadedSize) return t('Downloaded')
    if (isDownloading.value) return `${downloaded.value} %`

    return t('Download') + formatSiez(props.item.fileSize * 1024)
})

async function toDownload(event: Event) {
    event.preventDefault(); // 阻止 a 标签的默认跳转行为

    filesList.value = await nexusmods.getFileList(props.item)

    if (filesList.value.length == 0) {
        ElMessage.error(t('No files available for download.'))
        return
    }

    console.log(filesList.value);

    if (filesList.value.length > 1) {
        showDialog.value = true
        return
    }

    download.addDownloadByNexusMods({
        domainName: props.item.game.domainName,
        modId: props.item.modId,
        author: props.item.uploader.name,
        modName: props.item.name,
        fileId: filesList.value[0].file_id,
        version: filesList.value[0].version,
    })

}

function toDownloadFile() {
    if (!selectFile.value) return
    showDialog.value = false
    download.addDownloadByNexusMods({
        domainName: props.item.game.domainName,
        modId: props.item.modId,
        author: props.item.uploader.name,
        modName: props.item.name,
        fileId: selectFile.value.file_id,
        version: selectFile.value.version,
    })
}

</script>
<template>
    <v-chip label color="orange-lighten-2" variant="text" @click="toDownload" :disabled="disabled">
        <template v-slot:append>
            <v-progress-circular v-if="isDownloading" :model-value="downloaded" color="deep-orange-lighten-2"
                size="25"></v-progress-circular>
            <v-icon v-else>mdi-download</v-icon>
        </template>
        {{ text }}
    </v-chip>
    <Dialog v-model="showDialog">
        <template #header>
            <div class="title">{{ t('Select the file to download') }}</div>
        </template>
        <div class="files">
            <el-select v-model="selectFile" value-key="file_id">
                <el-option v-for="item in filesList" :key="item.file_id" :label="item.name" :value="item">
                    <div class="file-list">
                        <div class="name">{{ item.name }}</div>
                        <div class="size">{{ formatSiez(item.size) }} | v{{ item.version }}</div>
                    </div>
                </el-option>
            </el-select>
        </div>
        <template #footer>
            <el-button @click="toDownloadFile">{{ $t('Download') }}</el-button>
        </template>
    </Dialog>
</template>
<script lang='ts'>

export default {
    name: 'NexusModsDownloadBtn',
}
</script>
<style lang='less' scoped>
.file-list {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .size {
        font-size: 12px;
        color: #999;
    }
}
</style>
