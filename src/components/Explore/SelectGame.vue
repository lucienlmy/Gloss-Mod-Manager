<script lang='ts' setup>
import { ISupportedGames } from '@src/model/Interfaces';
import { useExplore } from '@src/stores/useExplore';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const explore = useExplore()
const manager = useManager()
const settings = useSettings()
const { t } = useI18n()

let searchText = ref("")

let list = computed<ISupportedGames[]>(() => {
    const list = manager.supportedGames.map((item) => ({
        name: t(item.gameName),
        game: item,
    }));
    const filterList = list.filter(({ name }) =>
        name.toLowerCase().includes(searchText.value.toLowerCase())
    );
    return filterList.map(({ game }) => game);
})


function select(all: boolean) {
    if (all) {
        settings.settings.tourGameList = list.value.map(item => item.gameID)
    } else {
        // 反选
        settings.settings.tourGameList = list.value.filter(item => !settings.settings.tourGameList.includes(item.gameID)).map(item => item.gameID)
    }
}

function isOk() {
    console.log(settings.settings.tourGameList);
    explore.showTourGameListDialog = false
}

</script>
<template>
    <v-dialog v-model="explore.showTourGameListDialog" persistent width="900px">
        <template v-slot:activator="{ props }">
            <v-chip append-icon="mdi-package-variant-closed" v-bind="props" label variant="text"> 选择游览游戏</v-chip>
        </template>
        <v-card>
            <v-card-title>
                <v-col cols="12" class="top">
                    <div class="title">
                        <div class="text">
                            {{ $t('select game') }}
                            <small>({{ ` ${settings.settings.tourGameList.length}/${list.length}` }})</small>
                            <v-chip label append-icon="mdi-check" @click="select(true)" variant="text">全选</v-chip>
                            <v-chip label append-icon="mdi-close" @click="select(false)" variant="text">反选</v-chip>
                        </div>
                        <v-text-field density="compact" variant="solo" :label="$t('Search Game')"
                            append-inner-icon="mdi-magnify" single-line hide-details v-model="searchText"></v-text-field>
                    </div>
                    <div class="close">
                        <v-chip label append-icon="mdi-close" @click="explore.showTourGameListDialog = false"
                            variant="text">{{ $t('Close') }}</v-chip>
                    </div>
                </v-col>
            </v-card-title>
            <v-card-text class="content">
                <v-item-group multiple v-model="settings.settings.tourGameList">
                    <div class="list-wrap">
                        <v-item v-for="item in list" v-slot="{ isSelected, toggle }" :value="item.gameID">
                            <v-list-item :title="$t(item.gameName)" @click="toggle">
                                <template v-slot:prepend>
                                    <v-list-item-action start>
                                        <v-checkbox-btn :model-value="isSelected"></v-checkbox-btn>
                                    </v-list-item-action>
                                </template>
                            </v-list-item>
                        </v-item>
                    </div>
                </v-item-group>
            </v-card-text>
            <v-card-actions class="flex-row-reverse">
                <v-chip label variant="text" @click="isOk">确定</v-chip>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang='ts'>

export default {
    name: 'GlossModSelectGame',
}
</script>
<style lang='less' scoped>
.content {
    min-height: 300px;
    max-height: 400px;
    overflow: auto;
}
</style>