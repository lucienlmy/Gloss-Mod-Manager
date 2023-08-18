<script lang='ts' setup>
import { IModInfo } from '@src/model/Interfaces';
import { useManager } from '@src/stores/useManager';
import { usePacks } from '@src/stores/usePacks';


const props = defineProps<{
    modList: IModInfo[],
    subheader: string
}>()

const packs = usePacks()


</script>
<template>
    <v-item-group multiple v-model="packs.packs">
        <v-list-subheader>{{ `${subheader} (${packs.packs.length})` }}</v-list-subheader>
        <div class="list-wrap">
            <v-item v-for="item in modList" v-slot="{ isSelected, toggle }" :value="item">
                <v-list-item :title="item.modName" @click="toggle">
                    <template v-slot:prepend>
                        <v-list-item-action start>
                            <v-checkbox-btn :model-value="isSelected"></v-checkbox-btn>
                        </v-list-item-action>
                    </template>
                </v-list-item>
            </v-item>
        </div>
    </v-item-group>
</template>
<script lang='ts'>

export default {
    name: 'PackList',
}
</script>
<style lang='less' scoped>
.list-wrap {
    max-height: 400px;
    overflow-y: auto;
}
</style>