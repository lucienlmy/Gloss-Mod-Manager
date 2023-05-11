<script lang='ts' setup>
import { IModInfo, IType } from '@src/model/Interfaces';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { useDownload } from '@src/stores/useDownload';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, ref } from 'vue';
import { FileHandler } from '@src/model/FileHandler'

const props = defineProps<{
    mod: IModInfo
}>()

const settings = useSettings()
const manager = useManager()
const download = useDownload()

let showInfo = ref(false)

let type = computed<IType | undefined>(() => {
    return settings.settings.managerGame.modType.find((item) => {
        return item.id == props.mod.modType
    })
})



let info = computed(() => {
    let mod = props.mod
    let modStorage = `${settings.settings.modStorageLocation}\\${settings.settings.managerGame.gameEnName}\\${mod.id}`
    let list = [
        { title: "名称", content: mod.modName },
        { title: "版本", content: mod.modVersion },
        { title: "MD5", content: mod.md5 },
        { title: "储存位置", content: modStorage },
    ]

    if (mod.webId) {
        list.push({ title: "网址", content: `https://mod.3dmgame.com/mod/${mod.webId}` })
        list.push({ title: "作者", content: mod.modAuthor ?? "" })
    }

    return list
})

function open() {
    let modStorage = `${settings.settings.modStorageLocation}\\${settings.settings.managerGame.gameEnName}\\${props.mod.id}`
    FileHandler.openFolder(modStorage)
}

function openWeb() {
    window.open(`https://mod.3dmgame.com/mod/${props.mod.webId}`)
}

function toDel() {
    if (props.mod.isInstalled) {
        type.value?.uninstall(props.mod)
    }
    manager.deleteMod(props.mod)
}

function del() {
    ElMessageBox.confirm("您确认要删除这个Mod吗?", { draggable: true })
        .then(toDel)
        .catch(() => { })
}

function reinstall() {
    if (props.mod.webId) {
        toDel()
        download.addDownloadById(props.mod.webId)
    }
    else ElMessage.error("该作品不是从管理器下载的, 无法获取更新")
}
</script>
<template>
    <v-menu open-on-hover>
        <template v-slot:activator="{ props }">
            <v-btn variant="text" v-bind="props"><v-icon>mdi-menu</v-icon></v-btn>
        </template>
        <v-list>
            <v-list-item append-icon="mdi-information-slab-circle-outline" title="信息" @click="showInfo = true">
            </v-list-item>
            <v-list-item append-icon="mdi-folder-open-outline" title="打开" @click="open"></v-list-item>
            <v-list-item v-if="mod.webId" append-icon="mdi-web" title="网站" @click="openWeb"></v-list-item>
            <v-list-item v-if="mod.webId" append-icon="mdi-refresh" title="更新" @click="reinstall"></v-list-item>
            <v-list-item append-icon="mdi-trash-can-outline" title="删除" @click="del"> </v-list-item>
        </v-list>
    </v-menu>
    <v-dialog v-model="showInfo" width="600">
        <v-card class="info">
            <v-row v-for="item in info" :key="item.title">
                <v-col cols="2">{{ item.title }}</v-col>
                <v-col cols="10" class="text-truncate" :title="item.content">{{ item.content }}</v-col>
            </v-row>
        </v-card>
    </v-dialog>
</template>
<script lang='ts'>

export default {
    name: 'ContentModMenu',
}
</script>
<style lang='less' scoped>
.info {
    padding: 1rem;

    * {
        // 允许复制
        user-select: text;
    }
}
</style>