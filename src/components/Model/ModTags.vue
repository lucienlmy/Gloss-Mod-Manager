<script lang='ts' setup>

const props = defineProps<{
    mod: IModInfo
}>()

</script>
<template>
    <v-chip size="small" v-for="item in mod.tags" label :key="item.name" :color="item.color">
        {{ item.name }}</v-chip>
</template>
<script lang='ts'>

export default {
    name: 'ModTags',
}
</script>
<style lang='less' scoped></style>
