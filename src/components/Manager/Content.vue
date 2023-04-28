<script lang='ts' setup>
import { useManager } from '@src/stores/useManager';
import ContentList from '@src/components/Manager/Content/ListWrapper.vue'
import { useSettings } from '@src/stores/useSettings';

const manager = useManager()
const settings = useSettings()

</script>
<template>
    <div class="content">
        <div class="empty" v-if="!settings.settings.managerGame">
            <div @click="manager.selectGameDialog = true" class="empty-hint">您当前还未选择游戏,请先选择游戏 <v-icon>mdi-plus</v-icon>
            </div>
        </div>
        <div class="const-list" v-else>
            <ContentList></ContentList>
        </div>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'ManagerContent',
}
</script>
<style lang='less' scoped></style>