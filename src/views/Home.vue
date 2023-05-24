<script lang='ts' setup>

import Welcome from '@src/components/home/Welcome.vue'
import Sponsor from '@src/components/home/Sponsor.vue'

</script>
<template>
    <v-container fluid>
        <Welcome></Welcome>
        <Sponsor></Sponsor>
    </v-container>
</template>
<script lang='ts'>

export default {
    name: 'Home',
}
</script>
<style lang='less' scoped></style>