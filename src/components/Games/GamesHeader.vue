<script lang='ts' setup>
import { useSettings } from '@src/stores/useSettings';

import GameList from '@src/components/Games/GamesList.vue'
import SelectGame from '@src/components/Manager/SelectGame.vue'
import { useManager } from '@src/stores/useManager';

const Settings = useSettings()
const manager = useManager()

// console.log(Settings.settings.managerGameList);

</script>
<template>
    <v-card>
        <v-card-title>游戏库 <SelectGame></SelectGame> </v-card-title>
        <v-card-text>
            <v-row>
                <v-col cols="3">
                    <div class="add-game" @click="manager.selectGameDialog = true"></div>
                    <div class="add-game-text">{{ $t("Add Game") }}</div>
                </v-col>
                <v-col cols="3" v-for="item in Settings.settings.managerGameList" :key="item.GlossGameId">
                    <GameList :item="item"></GameList>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'GamesHeader',
}
</script>
<style lang='less' scoped>
.add-game {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 50px auto;
    cursor: pointer;



    &::before,
    &::after {
        content: '';
        position: absolute;
        background: transparent;
        border-style: dashed;
        border-color: rgb(--v-theme-surface);
        // 动画时间 1s
        transition: all .6s;
    }

    &::before {
        top: 50%;
        left: 0;
        right: 0;
        height: 0;
        border-width: 1px 0 0 0;
    }

    &::after {
        top: 0;
        bottom: 0;
        left: 50%;
        width: 0;
        border-width: 0 0 0 1px;
    }

    &:hover {

        &::before,
        &::after {
            opacity: .5;
        }
    }
}

.add-game-text {
    text-align: center;
}
</style>