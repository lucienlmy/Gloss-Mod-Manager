<script lang='ts' setup>

import SelectGame from '@src/components/Manager/SelectGame.vue'
import { useManager } from '@src/stores/useManager';

const manager = useManager()

</script>
<template>
    <div class="header">
        <SelectGame></SelectGame>
        <div class="select-game">当前游戏: {{ manager.managerGame?.gameName ?? '未选择' }}</div>
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