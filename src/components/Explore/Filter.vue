<script lang='ts' setup>
import { useExplore } from '@src/stores/useExplore';
import { computed } from 'vue';


const explore = useExplore()

let original_filter = computed(() => [
    { text: "全部", value: 0 },
    { text: "精华", value: 4 },
    { text: "原创", value: 1 },
    { text: "二次创作", value: 2 },
    { text: "翻译", value: 3 },
])
let time_filter = computed(() => [
    { text: "全部", value: 0 },
    { text: "今天", value: 1 },
    { text: "近7天", value: 2 },
    { text: "近30天", value: 3 },
    { text: "近3个月", value: 4 },
])
let order_filter = computed(() => [
    { text: "默认", value: 0 },
    { text: "最多游览", value: 1 },
    { text: "最多下载", value: 2 },
    { text: "最多点赞", value: 3 },
    { text: "最多收藏", value: 4 },
    { text: "最新发布", value: 5 },
])

</script>
<template>
    <v-row class="filter">
        <v-col cols="12" sm="4" lg="2">
            <v-select hide-details="auto" label="创作类型" v-model="explore.original" :items="original_filter" item-title="text"
                item-value="value" variant="solo"></v-select>
        </v-col>
        <v-col cols="12" sm="4" lg="2">
            <v-select hide-details="auto" label="更新时间" v-model="explore.time" :items="time_filter" item-title="text"
                item-value="value" variant="solo"></v-select>
        </v-col>
        <v-col cols="12" sm="4" lg="2">
            <v-select hide-details="auto" label="排序方式" v-model="explore.order" :items="order_filter" item-title="text"
                item-value="value" variant="solo"></v-select>
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'ExploreFilter',
}
</script>
<style lang='less' scoped></style>