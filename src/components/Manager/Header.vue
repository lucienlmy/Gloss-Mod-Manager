<script lang='ts' setup>

import SelectGame from '@src/components/Manager/SelectGame.vue'
import { FileHandler } from '@src/model/FileHandler';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { join } from 'path';
import { spawn, exec } from 'child_process';
import { ElMessage } from 'element-plus';
import ContentPack from '@src/components/Manager/Content/Pack/Pack.vue'
import { useUser } from '@src/stores/useUser';
import ManagerSort from '@src/components/Manager/Sort.vue'

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

async function startGame() {
    let startExe = settings.settings.managerGame?.startExe
    if (startExe) {

        // 判断 startExe 里面是否包含 steam 
        if (startExe.includes('steam')) {
            exec(`start ${startExe}`)
        } else {
            startExe = join(settings.settings.managerGame?.gamePath ?? "", startExe)
            console.log(startExe);
            FileHandler.runExe(startExe)
        }
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
                <v-chip label variant="text" v-if="settings.settings.managerGame?.startExe" @click="startGame"
                    append-icon="mdi-menu-right">{{ $t("Launch Game") }}</v-chip>
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
                        <ContentPack :mod="{}"></ContentPack>
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