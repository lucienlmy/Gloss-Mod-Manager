<script lang='ts' setup>

import SelectGame from '@src/components/Manager/SelectGame.vue'
import { FileHandler } from '@src/model/FileHandler';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { join } from 'path';
import { spawn } from 'child_process';
import { ElMessage } from 'element-plus';

const settings = useSettings()
const manager = useManager()


function allInstall() {
    let list = manager.filterModList
    // console.log(list);
    list.forEach(item => {
        item.isInstalled = true
    })
}

function allUnInstall() {
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

async function startGame() {
    let startExe = settings.settings.managerGame?.startExe
    if (startExe) {
        startExe = join(settings.settings.managerGame?.gamePath ?? "", startExe)
        // console.log(startExe);
        spawn(startExe)
        ElMessage.success("启动成功~")
    }
}

</script>
<template>
    <div class="header">
        <div class="header-btn">
            <SelectGame></SelectGame>
            <template v-if="settings.settings.managerGame">
                <v-chip label variant="text" append-icon="mdi-arrow-bottom-left-thick"
                    @click="manager.selectMoeFiles">{{ $t('Import Mod') }}</v-chip>
                <v-chip label variant="text" append-icon="mdi-download" @click="allInstall">{{ $t('Install All') }}</v-chip>
                <v-chip label variant="text" append-icon="mdi-close"
                    @click="allUnInstall">{{ $t('Uninstall All') }}</v-chip>
                <v-chip label variant="text" @click="openFolder"
                    append-icon="mdi-folder-open-outline">{{ $t("Open Mod Folder") }}</v-chip>
                <v-chip label variant="text" v-if="settings.settings.managerGame?.startExe" @click="startGame"
                    append-icon="mdi-menu-right">{{ $t("Launch Game") }}</v-chip>
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