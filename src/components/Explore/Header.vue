<script lang='ts' setup>
import SelectGame from '@src/components/Manager/SelectGame.vue'
import { useSettings } from '@src/stores/useSettings';
import { computed } from "vue";

import GlossModSelectGame from "@src/components/Explore/SelectGame.vue";

const settings = useSettings()


let uploadMod = computed(() => {

    if (settings.settings.exploreType == "GlossMod") {
        return `https://mod.3dmgame.com/Workshop/PublishMod?gameId=${settings.settings.managerGame?.GlossGameId}`
    } else {
        return `https://www.nexusmods.com/${settings.settings.managerGame?.NexusMods?.game_domain_name}/mods/add`
    }
})

</script>
<template>
    <v-app-bar :elevation="0">
        <v-row>
            <v-col cols="12" class="header">
                <div class="left">
                    <SelectGame></SelectGame>
                    <v-chip label variant="text" append-icon="mdi-arrow-expand-up" color="#4FC3F7" :href="uploadMod">
                        {{ $t('Upload a Mod') }}
                    </v-chip>
                    <GlossModSelectGame v-if="!settings.settings.managerGame"></GlossModSelectGame>
                </div>
                <div class="right">
                    <v-chip-group v-model="settings.settings.exploreType" mandatory>
                        <v-chip label variant="text" value="GlossMod">{{ $t('3DM Mods') }} </v-chip>
                        <v-chip label v-if="settings.settings.managerGame?.Thunderstore" variant="text"
                            value="Thunderstore">{{ $t('Thunderstore') }} </v-chip>
                        <v-chip label v-if="settings.settings.managerGame?.mod_io" variant="text"
                            value="ModIo">{{ $t('mod.io') }}</v-chip>
                    </v-chip-group>
                </div>
            </v-col>
        </v-row>
    </v-app-bar>
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