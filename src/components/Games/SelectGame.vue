<script lang='ts' setup>

const manager = useManager()

</script>
<template>
    <v-chip label variant="text" append-icon="mdi-plus" @click="manager.selectGameDialog = true">{{ $t('select game')
    }}</v-chip>
</template>
<script lang='ts'>

export default {
    name: 'SelectGame'
}
</script>
<style lang='less' scoped></style>