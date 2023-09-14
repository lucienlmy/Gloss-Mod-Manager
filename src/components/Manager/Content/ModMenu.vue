<script lang='ts' setup>
import { IModInfo, IType } from '@src/model/Interfaces';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { useDownload } from '@src/stores/useDownload';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, ref } from 'vue';
import { FileHandler } from '@src/model/FileHandler'
import { useI18n } from 'vue-i18n';
import { join } from 'path'


const props = defineProps<{
    mod: IModInfo
}>()

const settings = useSettings()
const manager = useManager()
const download = useDownload()
const { t } = useI18n()

let showInfo = ref(false)

let type = computed<IType | undefined>(() => {
    return settings.settings.managerGame?.modType.find((item) => {
        return item.id == props.mod.modType
    })
})



let info = computed(() => {
    let mod = props.mod
    // let modStorage = `${settings.settings.modStorageLocation}\\${settings.settings.managerGame?.gameName}\\${mod.id}`
    let modStorage = join(settings.settings.modStorageLocation, settings.settings.managerGame?.gameName ?? "", mod.id.toString())
    let list = [
        { title: t('Name'), content: mod.modName },
        { title: t('Version'), content: mod.modVersion },
        { title: t('MD5'), content: mod.md5 },
        { title: t('Storage Location'), content: modStorage },
    ]

    if (mod.webId) {
        list.push({ title: t('Website'), content: `https://mod.3dmgame.com/mod/${mod.webId}` })
        list.push({ title: t('Author'), content: mod.modAuthor ?? "" })
    }

    return list
})

function open() {
    // let modStorage = `${settings.settings.modStorageLocation}\\${settings.settings.managerGame.gameName}\\${props.mod.id}`
    let modStorage = join(settings.settings.modStorageLocation, settings.settings.managerGame?.gameName ?? "", props.mod.id.toString())
    FileHandler.openFolder(modStorage)
}

function openWeb() {
    window.open(`https://mod.3dmgame.com/mod/${props.mod.webId}`)
}

function toDel() {
    if (props.mod.isInstalled) {
        type.value?.uninstall(props.mod)
    }
    FileHandler.writeLog(`删除: ${props.mod.modName}`)
    manager.deleteMod(props.mod)
}

function del() {
    ElMessageBox.confirm(t('Are you sure you want to delete this Mod?'), { draggable: true })
        .then(toDel)
        .catch(() => { })
}

function reinstall() {
    if (props.mod.webId) {
        FileHandler.writeLog(`更新: ${props.mod.modName}`)
        toDel()
        download.addDownloadById(props.mod.webId)
    }
    else ElMessage.error(t('This mod was not downloaded from the manager and cannot be updated'))
}
</script>
<template>
    <v-menu open-on-hover>
        <template v-slot:activator="{ props }">
            <v-btn variant="text" v-bind="props">
                <v-badge v-if="mod.isUpdate" dot floating color="success">
                    <v-icon>mdi-menu</v-icon>
                </v-badge>
                <v-icon v-else>mdi-menu</v-icon>
            </v-btn>
        </template>
        <v-list>
            <v-list-item append-icon="mdi-information-slab-circle-outline" :title="t('Info')" @click="showInfo = true">
            </v-list-item>
            <v-list-item append-icon="mdi-folder-open-outline" :title="t('Open')" @click="open"></v-list-item>
            <v-list-item v-if="mod.webId" append-icon="mdi-web" :title="t('Website')" @click="openWeb"></v-list-item>
            <v-list-item v-if="mod.webId" :title="t('Update')" @click="reinstall">
                <template v-slot:append>
                    <v-badge v-if="mod.isUpdate" dot floating color="success">
                        <v-icon>mdi-refresh</v-icon>
                    </v-badge>
                    <v-icon v-else>mdi-refresh</v-icon>
                </template>
            </v-list-item>
            <v-list-item append-icon="mdi-trash-can-outline" :title="t('Delete')" @click="del"> </v-list-item>
        </v-list>
    </v-menu>
    <v-dialog v-model="showInfo" width="600">
        <v-card class="info">
            <v-card-text>
                <v-row v-for="item in info" :key="item.title">
                    <v-col cols="2">{{ item.title }}</v-col>
                    <v-col cols="10" class="text-truncate" :title="item.content">{{ item.content }}</v-col>
                </v-row>
            </v-card-text>

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
    box-shadow: 0 0 5px black;


    * {
        // 允许复制
        user-select: text;
    }
}
</style>