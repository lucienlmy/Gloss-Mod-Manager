<script lang='ts' setup>
import { ipcRenderer } from "electron";
import { useManager } from '@src/stores/useManager';
import { basename, dirname, join } from 'path'
import { ElMessage } from "element-plus";
import { useMain } from "@src/stores/useMain";
import { useSettings } from "@src/stores/useSettings";
import { ref, computed } from "vue"
import type { IGameExe, IGameInfo, ISupportedGames } from "@src/model/Interfaces";
import { useI18n } from "vue-i18n";
import { AppAnalytics } from "@src/model/Analytics"
import { Steam } from "@src/model/Steam"
import { FileHandler } from "@src/model/FileHandler";

const manager = useManager()
const settings = useSettings()
const { lazy_img } = useMain()
const { t } = useI18n()

let searchText = ref("")

let list = computed<ISupportedGames[]>(() => {
    const list = manager.supportedGames.map((item) => ({
        name: t(item.gameName),
        game: item,
    }));
    const filterList = list.filter(({ name }) =>
        name.toLowerCase().includes(searchText.value.toLowerCase())
    );
    return filterList.map(({ game }) => game);

})

// =========== 让用户选择指定游戏 ===========
function select(item: ISupportedGames) {
    ipcRenderer.invoke("select-file", {
        properties: ['openDirectory'],
        filters: [{ name: '游戏主程序', extensions: ['exe'] }],
        defaultPath: Steam.getSteamGamePath(item.steamAppID, item.installdir)
    }).then((arg: string[]) => {
        if (arg.length > 0) {
            let files = FileHandler.getAllFilesInFolder(arg[0])
            if (typeof (item.gameExe) == 'string') {
                // 判断 item.gameExe 是否存在于 files 中
                if (files.includes(item.gameExe)) {
                    settings.settings.managerGame = item
                    settings.settings.managerGame.gamePath = arg[0]

                } else {
                    ElMessage.error(`请选择 ${item.gameExe} 所在目录.`)
                    return
                }
            } else {
                // 判断 item.gameExe 是否存在于 files 中
                let exe = item.gameExe.find(item => files.includes(item.name))
                if (exe) {
                    console.log(exe);
                    settings.settings.managerGame = item
                    settings.settings.managerGame.gamePath = join(arg[0], exe.rootPath)
                } else {
                    let exename = item.gameExe.map(item => item.name).join(' 或 ')
                    ElMessage.error(`请选择 ${exename} 所在目录.`)
                    return
                }
            }

            console.log(settings.settings);
            manager.selectGameDialog = false
            manager.getModInfo()
            AppAnalytics.sendEvent(`switch_game`, item.gameName)

            // 判断 settings.settings.managerGameList 中是否有 item
            let game = settings.settings.managerGameList?.find(game => game.gameName === item.gameName)
            if (game) {
                // game = item
                // 更新 settings.settings.managerGameList
                settings.settings.managerGameList = settings.settings.managerGameList.map(game => {
                    if (game.gameName === item.gameName) {
                        return item
                    } else {
                        return game
                    }
                })
            } else {
                settings.settings.managerGameList = [...settings.settings.managerGameList, item]
            }
        }
    })
}

// 快捷 切换游戏
function switchGame(game: ISupportedGames) {
    // console.log(game);
    // manager.supportedGames

    let sGame = manager.supportedGames.find(item => item.gameID == game.gameID)


    settings.settings.managerGame = {
        ...game,
        ...sGame,
    }

    console.log(settings.settings.managerGame);

    manager.getModInfo()
}

function delSwitchGame(game: ISupportedGames) {
    settings.settings.managerGameList = settings.settings.managerGameList.filter(item => item.gameID !== game.gameID)
}

</script>
<template>
    <v-dialog v-model="manager.selectGameDialog" persistent width="900px">
        <template v-slot:activator="{ props }">
            <template v-if="settings.settings.managerGameList?.length > 0">
                <v-menu open-on-hover>
                    <template v-slot:activator="{ props }">
                        <v-btn variant="text" append-icon="mdi-menu-down" v-bind="props">{{ $t('select game') }}</v-btn>
                    </template>
                    <v-list>
                        <v-list-item :title="$t('select game')" append-icon="mdi-plus"
                            @click="manager.selectGameDialog = true"></v-list-item>
                        <v-list-item v-for="item in settings.settings.managerGameList" :key="item.gameID"
                            @click.pointer="switchGame(item)" :title="$t(item.gameName)">
                            <template v-slot:append>
                                <v-btn icon="mdi-delete-outline" @click="delSwitchGame(item)" variant="text"></v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>
            <template v-else>
                <v-chip label variant="text" append-icon="mdi-plus" v-bind="props">{{ $t('select game') }}</v-chip>
            </template>
        </template>
        <v-card class="select-game">
            <v-row>
                <v-col cols="12" class="top">
                    <div class="title">
                        <div class="text">
                            {{ $t('select game') }}
                            <small>({{ $t('{0} games', [list.length]) }})</small>
                        </div>
                        <v-text-field density="compact" variant="solo" :label="$t('Search Game')"
                            append-inner-icon="mdi-magnify" single-line hide-details v-model="searchText"></v-text-field>
                    </div>
                    <div class="close">
                        <v-chip label append-icon="mdi-close" @click="manager.selectGameDialog = false"
                            variant="text">{{ $t('Close') }}</v-chip>
                    </div>
                </v-col>
                <v-divider></v-divider>
                <v-col cols="12" class="content">
                    <v-row>
                        <v-col cols="6" sm="4" md="3" class="game-list" v-for="item in list" :key="item.gameName"
                            @click="select(item)">
                            <v-row no-gutters>
                                <v-col cols="12">
                                    <v-img :lazy-src="lazy_img" :aspect-ratio="247 / 139" :src="item.gameCoverImg"
                                        :alt="item.gameName" min-height="90px" />
                                </v-col>
                                <v-col class="game-name" cols="12">{{ $t(item.gameName) }}</v-col>
                            </v-row>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>
        </v-card>
    </v-dialog>
</template>
<script lang='ts'>

export default {
    name: 'SelectGame',
}
</script>
<style lang='less' scoped>
.select-game {
    padding: 1rem;

    .top {
        display: flex;
        align-items: center;

        .title {
            flex: 1 1 auto;
            display: flex;
            align-items: center;

            small {
                opacity: .8;
            }
        }
    }


    .content {
        min-height: 300px;
        max-height: 400px;
        overflow: auto;

        .game-list {
            cursor: pointer;
            transition: background-color 0.3s ease-in-out;

            &:hover {
                background-color: rgba(0, 0, 0, 0.6);
            }

            .game-name {
                margin-top: 0.5rem;
            }
        }
    }
}
</style>