<script lang='ts' setup>
import Header from "@src/components/Explore/Header.vue";
import GlossMod from "@src/components/Explore/GlossMod/GlossMod.vue";
import NexusMods from "@src/components/Explore/NexusMods/NexusMods.vue";

import { useSettings } from "@src/stores/useSettings";

const settings = useSettings()


</script>
<template>
    <v-container fluid>
        <Header></Header>
        <GlossMod v-if="settings.settings.exploreType == 'GlossMod'"> </GlossMod>
        <NexusMods v-if="settings.settings.exploreType == 'NexusMods'"> </NexusMods>
    </v-container>
</template>
<script lang='ts'>

export default {
    name: 'Explore',
}
</script>
<style lang='less' scoped></style>