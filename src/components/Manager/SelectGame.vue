<script lang='ts' setup>
import { ipcRenderer } from "electron";
import { useManager } from '@src/stores/useManager';
import { basename, dirname } from 'path'
import { ElMessage } from "element-plus";
import { useMain } from "@src/stores/useMain";
import { useSettings } from "@src/stores/useSettings";

const manager = useManager()
const settings = useSettings()
const { lazy_img } = useMain()

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
            } else {
                ElMessage.error('您选择的游戏我们暂时不支持..')
            }
        }
    })
}

</script>
<template>
    <v-dialog v-model="manager.selectGameDialog" persistent width="900px">
        <template v-slot:activator="{ props }">
            <v-btn variant="text" append-icon="mdi-plus" v-bind="props">选择游戏</v-btn>
        </template>
        <v-card class="select-game">
            <v-row>
                <v-col cols="12" class="top">
                    <div class="title">
                        选择游戏
                    </div>
                    <div class="close">
                        <v-btn append-icon="mdi-close" @click="manager.selectGameDialog = false" variant="text">关闭</v-btn>
                    </div>
                </v-col>
                <v-divider></v-divider>
                <!-- <v-col cols="12" class="button">
                    <v-btn variant="text" append-icon="mdi-autorenew" @click="autoSearchGame"
                        :loading="audoButton">自动搜索</v-btn>
                    <v-btn variant="text" append-icon="mdi-magnify" @click="select">手动选择</v-btn>
                </v-col> -->
                <v-col cols="12" class="content">
                    <v-row>
                        <v-col cols="12" sm="6" md="4" lg="3" class="game-list" v-for="item in manager.supportedGames"
                            :key="item.gameExe" @click="select">
                            <v-row no-gutters>
                                <v-col cols="12">
                                    <v-img :lazy-src="lazy_img" :aspect-ratio="247 / 139" :src="item.gameCoverImg"
                                        :alt="item.gameName" min-height="90px" />
                                </v-col>
                                <v-col class="game-name" cols="12">{{ item.gameName }}</v-col>
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