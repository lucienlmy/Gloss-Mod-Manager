<script lang='ts' setup>

import SelectGame from '@src/components/Manager/SelectGame.vue'
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';

const settings = useSettings()
const manager = useManager()

</script>
<template>
    <div class="header">
        <div class="header-btn">
            <SelectGame></SelectGame>
            <v-btn variant="text" v-if="manager.managerModList.length > 0" append-icon="mdi-arrow-bottom-left-thick"
                @click="manager.selectMoeFiles">导入Mod</v-btn>
        </div>
        <div class="select-game">当前游戏 『{{ settings.settings.managerGame?.gameName ?? '未选择' }}』</div>
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