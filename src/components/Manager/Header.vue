<script lang='ts' setup>

import SelectGame from '@src/components/Manager/SelectGame.vue'
import { FileHandler } from '@src/model/FileHandler';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';

import { ElMessage } from 'element-plus';
import ContentPack from '@src/components/Manager/Pack/Pack.vue'
import { useUser } from '@src/stores/useUser';
import ManagerSort from '@src/components/Manager/Sort.vue'
import StartGame from '@src/components/Manager/StartGame.vue'
import PackInport from '@src/components/Manager/Pack/Inport.vue'

const settings = useSettings()
const manager = useManager()
const user = useUser()

function allInstall() {
    if (!user.user) {
        user.loginBox = true
        ElMessage.warning('登录后可使用本功能！')
        return
    }

    let list = manager.filterModList
    // console.log(list);
    list.forEach(item => {
        item.isInstalled = true
    })
}

function allUnInstall() {
    if (!user.user) {
        user.loginBox = true
        ElMessage.warning('登录后可使用本功能！')
        return
    }
    let list = manager.filterModList
    // console.log(list);
    list.forEach(item => {
        item.isInstalled = false
    })
}

function openFolder() {
    const modStorage = `${settings.settings.modStorageLocation}\\${settings.settings.managerGame?.gameName}`
    FileHandler.openFolder(modStorage)
}
function openGameFolder() {
    FileHandler.openFolder(settings.settings.managerGame?.gamePath ?? "")
}

</script>
<template>
    <div class="header">
        <div class="header-btn">
            <PackInport></PackInport>
            <SelectGame></SelectGame>
            <template v-if="settings.settings.managerGame">
                <v-chip label variant="text" append-icon="mdi-arrow-bottom-left-thick"
                    @click="manager.selectMoeFiles">{{ $t('Import Mod') }}</v-chip>
                <StartGame></StartGame>
                <v-menu open-on-hover>
                    <template v-slot:activator="{ props }">
                        <v-btn variant="text" v-bind="props"><v-icon>mdi-menu</v-icon></v-btn>
                    </template>
                    <v-list>
                        <v-list-item :title="$t('Install All')" append-icon="mdi-download"
                            @click="allInstall"></v-list-item>
                        <v-list-item :title="$t('Uninstall All')" append-icon="mdi-close"
                            @click="allUnInstall"></v-list-item>
                        <v-list-item :title="$t('Open Mod Folder')" @click="openFolder"
                            append-icon="mdi-folder-open-outline"></v-list-item>
                        <v-list-item :title="$t('Open Game Folder')" @click="openGameFolder"
                            append-icon="mdi-folder-open-outline"></v-list-item>
                        <ContentPack></ContentPack>
                        <ManagerSort></ManagerSort>
                    </v-list>
                </v-menu>
            </template>
        </div>
        <div class="select-game">
            {{ $t('Current Game', [settings.settings.managerGame?.gameName ? $t(settings.settings.managerGame.gameName) : $t('Not Selected')]) }}
        </div>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'ManagerHeader',
}
</script>
<style lang='less' scoped>
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
</style>