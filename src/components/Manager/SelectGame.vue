<script lang='ts' setup>
import { ipcRenderer } from "electron";
import { useManager } from '@src/stores/useManager';
import { basename, dirname, join } from 'path'
import { ElMessage } from "element-plus";
import { useMain } from "@src/stores/useMain";
import { useSettings } from "@src/stores/useSettings";
import { ref, computed } from "vue"
import { IGameExe } from "@src/model/Interfaces";
import { useI18n } from "vue-i18n";
import { AppAnalytics } from "@src/model/Analytics"

const manager = useManager()
const settings = useSettings()
const { lazy_img } = useMain()
const { t } = useI18n()

let searchText = ref("")

let list = computed(() => {
    const nameMapper = (item: any) => ({
        name: t(item.gameName),
        game: item,
    });
    const list = manager.supportedGames.map(nameMapper);
    const filterList = list.filter(({ name }) =>
        name.toLowerCase().includes(searchText.value.toLowerCase())
    );
    return filterList.map(({ game }) => game);

})

// =========== 让用户选择指定游戏 ===========
function select() {
    ipcRenderer.invoke("select-file", {
        properties: ['openFile'],
        filters: [{ name: '游戏主程序', extensions: ['exe'] }]
    }).then((arg: string[]) => {
        if (arg.length > 0) {
            const filePath = arg[0]
            let name = basename(filePath)
            console.log(name);

            // 判断 supportedGames 中是否有该游戏
            let supportedGame = manager.supportedGames.find((item) => {
                return item.gameExe === name
            })
            if (supportedGame) {
                settings.settings.managerGame = supportedGame
                settings.settings.managerGame.gamePath = dirname(filePath)
                console.log(settings.settings);
                manager.selectGameDialog = false
                manager.getModInfo()
                AppAnalytics.sendEvent(`switch_game`, supportedGame.gameName)
            } else {
                let exe: IGameExe | undefined
                supportedGame = manager.supportedGames.find(item => {
                    if (typeof (item.gameExe) != 'string') {
                        exe = item.gameExe.find(item => item.name === name)
                        return exe ? true : false
                    }
                })
                if (supportedGame && exe) {
                    let path = join(filePath, exe.rootPath)
                    settings.settings.managerGame = supportedGame
                    settings.settings.managerGame.gamePath = dirname(path)
                    console.log(settings.settings);
                    manager.selectGameDialog = false
                    manager.getModInfo()
                    AppAnalytics.sendEvent(`switch_game`, supportedGame.gameName)

                } else {
                    ElMessage.error('您选择的游戏我们暂时不支持..')
                }

            }
        }
    })
}

</script>
<template>
    <v-dialog v-model="manager.selectGameDialog" persistent width="900px">
        <template v-slot:activator="{ props }">
            <v-chip label variant="text" append-icon="mdi-plus" v-bind="props">{{ $t('select game') }}</v-chip>
        </template>
        <v-card class="select-game">
            <v-row>
                <v-col cols="12" class="top">
                    <div class="title">
                        <div class="text">
                            {{ $t('select game') }}
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
                            @click="select">
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