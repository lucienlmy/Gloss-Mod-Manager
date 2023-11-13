<script lang='ts' setup>
import { useExplore } from "@src/stores/useExplore";
import { ipcRenderer } from "electron";
import { ElMessage } from "element-plus";
import { watch } from "vue";
import { useSettings } from "@src/stores/useSettings";
import { useManager } from "@src/stores/useManager";

import Search from '@src/components/Explore/Search.vue'
import ModList from '@src/components/Explore/GlossMod/ModList.vue'
import Filter from '@src/components/Explore/GlossMod/Filter.vue'
import TurnPage from "@src/components/Explore/GlossMod/TurnPage.vue";



const explore = useExplore()
if (explore.mods.length == 0) {
    explore.GetModList()
}


const settings = useSettings()
const manager = useManager()

ipcRenderer.on("get-mod-list-reply", (event, arg) => {
    // console.log(arg) // 打印获取到的数据
    if (arg.code == "00") {
        explore.mods = arg.data.mod
        explore.game = arg.data.game
        explore.count = arg.data.count
    } else {
        ElMessage.error(arg)
    }

    // 滚动到顶部
    document.documentElement.scrollTop = 0
})

watch([
    () => explore.order,
    () => explore.original,
    () => explore.time,
    () => settings.settings.managerGame?.gameID,
    () => explore.gameType
], () => {
    explore.page = 1
    explore.GetModList()
})

watch(() => explore.page, () => {
    explore.GetModList()
})

</script>
<template>
    <Search>
        <v-text-field v-model="explore.searchText" class="search-input "
            :placeholder="$t('You can search for what you want here')" variant="underlined" @keydown.enter="explore.search"
            append-inner-icon="mdi-magnify" @click:append-inner="explore.search">
        </v-text-field>
    </Search>
    <Filter></Filter>
    <v-row v-if="!settings.settings.managerGame" class="empty">
        <div @click="manager.selectGameDialog = true" class="empty-hint">
            {{ $t('You have not selected a game yet. Please select a game first') }} <v-icon>mdi-plus</v-icon>
        </div>
    </v-row>
    <v-row class="mod-wrap" v-else-if="explore.mods.length > 0">
        <v-col cols="12" sm="6" md="3" xl="2" class="mod-list" v-for="item in explore.mods" :key="item.id">
            <ModList :mod="item"></ModList>
        </v-col>
        <TurnPage></TurnPage>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'GlossMod',
}
</script>
<style lang='less' scoped></style>