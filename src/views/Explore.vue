<script lang='ts' setup>
import { ipcRenderer } from "electron";
import { useExplore } from "@src/stores/useExplore";
import { ElMessage } from "element-plus";
import { watch } from "vue";

import Search from '@src/components/Explore/Search.vue'
import ModList from '@src/components/Explore/ModList.vue'
import Filter from '@src/components/Explore/Filter.vue'
import TurnPage from "@src/components/Explore/TurnPage.vue";
import { useSettings } from "@src/stores/useSettings";

const explore = useExplore()
const settings = useSettings()
explore.GetModList()

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
    <v-container fluid>
        <Search></Search>
        <Filter></Filter>
        <v-row class="mod-wrap" v-if="explore.mods.length > 0">
            <v-col cols="12" sm="6" md="3" xl="2" class="mod-list" v-for="item in explore.mods" :key="item.id">
                <ModList :mod="item"></ModList>
            </v-col>
        </v-row>
        <TurnPage></TurnPage>
    </v-container>
</template>
<script lang='ts'>

export default {
    name: 'Explore',
}
</script>
<style lang='less' scoped></style>