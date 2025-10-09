<script lang="ts" setup>
import { ref, computed } from "vue";
import { ipcRenderer } from "electron";

import { useI18n } from "vue-i18n";
import axios from "axios";
import { ElMessageBox } from "element-plus";
const props = defineProps<{
    id: number;
    size?: string;
}>();
const download = useDownload();
const settings = useSettings();
const { t } = useI18n();

let link = ref(""); // 下载地址
let isDownloading = computed(() => {
    if (task.value) return true;
    return false;
});
let downloaded = computed(() => {
    if (task.value) {
        // console.log(task.value);
        // return task.value.progress
        return (
            Math.floor(
                (task.value.downloadedSize / task.value.totalSize) * 10000
            ) / 100
        ); // 计算下载进度
    }
    return 0;
});

// 禁用按钮
let disabled = computed(() => {
    if (!settings.settings.managerGame) return true;
    if (isDownloading.value) return true;
    return false;
});

let task = computed<IDownloadTask | undefined>(() => {
    return download.getTaskById(props.id);
});

async function toDownload() {
    try {
        download.addDownloadById(props.id);
    } catch (error) {}
}

let text = computed(() => {
    if (!settings.settings.managerGame)
        return t("Please manage the game first.");
    if (task.value && task.value.totalSize == task.value.downloadedSize)
        return t("Downloaded");
    if (isDownloading.value) return `${downloaded.value} %`;

    return `${t("Download")} | ${props.size}`;
});
</script>
<template>
    <v-chip
        label
        color="orange-lighten-2"
        variant="text"
        @click="toDownload"
        :disabled="disabled"
    >
        <template v-slot:append>
            <v-progress-circular
                v-if="isDownloading"
                :model-value="downloaded"
                color="deep-orange-lighten-2"
                size="25"
            ></v-progress-circular>
            <v-icon v-else>mdi-download</v-icon>
        </template>
        {{ text }}
    </v-chip>
</template>
<script lang="ts">
export default {
    name: "ExploreDownloadBtn",
};
</script>
<style lang="less" scoped></style>
