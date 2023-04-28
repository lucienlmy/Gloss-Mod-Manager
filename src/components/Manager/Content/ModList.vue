<script lang='ts' setup>
import type { IModInfo, IType } from '@src/model/Interfaces';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';

import { computed, watch } from "vue";

const props = defineProps<{
    mod: IModInfo
}>()

const manager = useManager()
const settings = useSettings()

let type = computed<IType>(() => {
    return settings.settings.managerGame.modType[props.mod.modType];
})

watch(() => props.mod.isInstalled, () => {
    console.log(settings.settings.managerGame);
})

</script>
<template>
    <v-col cols="12">
        <v-row class="mod-list">
            <v-col cols="6">{{ mod.modName }}</v-col>
            <v-col cols="2">{{ mod.modVersion }}</v-col>
            <v-col cols="2">
                <v-select v-model="mod.modType" variant="solo" :items="settings.settings.managerGame.modType"
                    :hide-details="true" item-title="name" item-value="id">
                </v-select>
            </v-col>
            <v-col cols="2">
                <v-switch v-model="mod.isInstalled" :label="mod.isInstalled ? '已安装' : '未安装'" :hide-details="true"
                    color="#0288D1"></v-switch>
            </v-col>
        </v-row>
    </v-col>
</template>
<script lang='ts'>

export default {
    name: 'ContentModList',
}
</script>
<style lang='less' scoped>
.mod-list {
    display: flex;
    align-items: center;
}
</style>