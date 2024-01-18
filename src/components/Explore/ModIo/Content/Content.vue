<script lang='ts' setup>
import { useModIo } from '@src/stores/useModIo';
import { useRoute } from 'vue-router';

import ContentHeader from "@src/components/Explore/ModIo/Content/ContentHeader.vue"
import Markdown from '@src/components/Model/Markdown.vue'


const modio = useModIo()
const route = useRoute()

if (route.params.modId) {
    modio.getModDataById(parseInt(route.params.modId as string))
}


</script>
<template>
    <v-card :loading="!modio.selected.data">
        <v-card-text v-if="modio.selected.data">
            <ContentHeader></ContentHeader>

            <v-card>
                <v-card-title>
                    {{ $t('Summary') }}
                </v-card-title>
                <v-card-text>
                    <Markdown :text="modio.selected.data.summary"></Markdown>
                </v-card-text>
            </v-card>
            <v-card>
                <v-card-title>
                    {{ $t('Description') }}
                </v-card-title>
                <v-card-text>
                    <Markdown :text="modio.selected.data.description"></Markdown>
                </v-card-text>
            </v-card>

            <div class="back-btn">
                <v-btn icon="mdi-arrow-u-left-top-bold" @click="$router.back"></v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'Content',
}
</script>
<style lang='less' scoped>
.back-btn {
    position: fixed;
    // 右下角
    right: 1rem;
    bottom: 1rem;
}
</style>