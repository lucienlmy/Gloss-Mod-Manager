<script lang='ts' setup>
import type { IModInfo } from '@src/model/Interfaces'
import { useManager } from '@src/stores/useManager';
import { ipcRenderer } from 'electron'
import { ElMessage } from 'element-plus'

// const props = defineProps<{
//     info: IModInfo
// }>()

const manager = useManager()

// manager.packInfo?

function add() {
    if (!manager.packInfo.corePlugins) manager.packInfo.corePlugins = [{ id: 0, name: "" }]
    else manager.packInfo.corePlugins?.push({ id: 0, name: "" })
    console.log(manager.packInfo.corePlugins);
}

function minus(item: any) {
    (manager.packInfo.corePlugins as any) = manager.packInfo.corePlugins?.filter(obj => obj.id !== item.id);

}


</script>
<template>
    <v-expansion-panels>
        <v-expansion-panel title="依赖">
            <v-expansion-panel-text>
                <v-row v-if="manager.packInfo?.corePlugins" v-for="item in manager.packInfo?.corePlugins" :key="item.id"
                    class="item">
                    <v-col cols="5">
                        <v-text-field variant="solo-filled" :label="$t('Requirements')" v-model="item.id"></v-text-field>
                    </v-col>
                    <v-col cols="7">
                        <v-text-field variant="solo-filled" :label="$t('Requirements Name')" v-model="item.name"
                            append-icon="mdi-minus" @click:append="minus(item)"></v-text-field>
                    </v-col>
                </v-row>
                <v-btn block append-icon="mdi-plus" @click="add">添加依赖</v-btn>
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-expansion-panels>
</template>
<script lang='ts'>

export default {
    name: 'PackRequirements',
}
</script>
<style lang='less' scoped>
.item {
    display: flex;
}
</style>