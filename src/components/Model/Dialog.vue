<script lang='ts' setup>

const props = defineProps<{
    show: boolean
}>()

const emit = defineEmits(['update:show'])

const show = computed({
    get: () => props.show,
    set: (val) => {
        emit('update:show', val)
    }
})

</script>
<template>
    <el-dialog class="dialog" :props v-model="show" draggable :close-on-click-modal="false" append-to-body
        width="900px">
        <template #header>
            <slot name="header"></slot>
        </template>
        <template #default>
            <slot></slot>
        </template>
        <template #footer>
            <slot name="footer"></slot>
        </template>
        <template #title>
            <slot name="title"></slot>
        </template>
    </el-dialog>
</template>
<script lang='ts'>

export default {
    name: 'Dialog',
}
</script>
<style lang='less' scoped>
.dialog {
    z-index: 100000000;
}
</style>
