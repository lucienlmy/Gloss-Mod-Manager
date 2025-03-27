<script lang='ts' setup>
import NexusModsModList from './ModList.vue'
import NexusModsFilter from './Filter.vue'

const nexusMods = useNexusMods()

if (nexusMods.mods.length == 0) {
    nexusMods.getModList()
}

watch(() => nexusMods.page, () => {
    nexusMods.getModList()
})

</script>
<template>
    <Search>
        <v-text-field v-model="nexusMods.searchText" class="search-input "
            :placeholder="$t('You can search for what you want here')" variant="underlined"
            @keydown.enter="nexusMods.search" append-inner-icon="mdi-magnify" @click:append-inner="nexusMods.search">
        </v-text-field>
    </Search>
    <v-card :loading="nexusMods.loading">
        <v-card-text>
            <v-row>
                <NexusModsFilter></NexusModsFilter>
                <v-col cols="12" sm="6" md="3" xl="2" class="mod-list" v-for="item in nexusMods.mods" :key="item.modId">
                    <NexusModsModList :item="item" />
                </v-col>
                <v-col cols="12" v-if="nexusMods.mods.length > 0">
                    <v-pagination v-model="nexusMods.page" :length="nexusMods.pageLength"></v-pagination>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'NexusMods',
}
</script>
<style lang='less' scoped></style>
