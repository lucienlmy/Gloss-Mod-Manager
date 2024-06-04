<script lang='ts' setup>
import { useSettings } from '@src/stores/useSettings';

import GameList from '@src/components/Games/GamesList.vue'
import SelectGame from '@src/components/Manager/SelectGame.vue'

const Settings = useSettings()

// console.log(Settings.settings.managerGameList);

</script>
<template>
    <v-card>
        <v-card-title>游戏库 <SelectGame></SelectGame> </v-card-title>
        <v-card-text>
            <v-row>
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
<style lang='less' scoped></style>