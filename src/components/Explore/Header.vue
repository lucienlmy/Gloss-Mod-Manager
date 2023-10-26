<script lang='ts' setup>
import SelectGame from '@src/components/Manager/SelectGame.vue'
import { useSettings } from '@src/stores/useSettings';

const settings = useSettings()

</script>
<template>
    <v-row>
        <v-col cols="12" class="header">
            <SelectGame></SelectGame>
            <v-chip label variant="text" append-icon="mdi-arrow-expand-up" color="#4FC3F7"
                :href="`https://mod.3dmgame.com/Workshop/PublishMod?gameId=${settings.settings.managerGame?.gameID}`">
                {{ $t('Upload a Mod') }}
            </v-chip>
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'ExploreHeader',
}
</script>
<style lang='less' scoped>
.header {
    display: flex;
    justify-content: space-between;
}
</style>