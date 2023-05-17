<script lang='ts' setup>
import { useManager } from '@src/stores/useManager';
import ContentList from '@src/components/Manager/Content/ListWrapper.vue'
import { useSettings } from '@src/stores/useSettings';
import { computed } from "vue";

const manager = useManager()
const settings = useSettings()

let types = computed(() => {
    return settings.settings.managerGame.modType
})

</script>
<template>
    <div class="content">
        <div class="empty" v-if="!settings.settings.managerGame">
            <div @click="manager.selectGameDialog = true" class="empty-hint">
                {{ $t('You have not selected a game yet. Please select a game first') }} <v-icon>mdi-plus</v-icon>
            </div>
        </div>
        <div class="const-list" v-else>
            <v-chip-group v-model="manager.filterType" mandatory>
                <v-chip label variant="text" :value="0">{{ $t('All') }}
                    <small v-if="manager.filterType == 0">({{ manager.filterModList.length }})</small> </v-chip>
                <v-chip label variant="text" v-for="item in types" :key="item.id" :value="item.id">
                    {{ item.name }}
                    <small v-if="manager.filterType == item.id">({{ manager.filterModList.length }})</small>
                </v-chip>
            </v-chip-group>
            <ContentList></ContentList>
        </div>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'ManagerContent',
}
</script>
<style lang='less' scoped>
small {
    font-size: 12px;
    color: #999;
    margin-left: 0.5rem;
}
</style>