<script lang='ts' setup>
import { useExplore } from '@src/stores/useExplore';


const explore = useExplore()


</script>
<template>
    <div class="turn-page">
        <v-pagination v-model="explore.page" :length="explore.pageLength"></v-pagination>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'ExploreTurnPage',
}
</script>
<style lang='less' scoped></style>