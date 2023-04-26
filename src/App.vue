<script lang='ts' setup>
// import { initialization } from '@src/model/config'

import AppHeader from '@src/components/base/AppHeader.vue'
import LeftMenu from '@src/components/base/LeftMenu.vue'

// initialization()

</script>
<template>
    <v-card>
        <v-layout>
            <AppHeader></AppHeader>
            <LeftMenu></LeftMenu>
            <v-main style="min-height: 100vh;">
                <router-view v-slot="{ Component }">
                    <keep-alive>
                        <component :is="Component" />
                    </keep-alive>
                </router-view>
            </v-main>
        </v-layout>
    </v-card>
</template>

<script lang='ts'>

export default {
    name: 'App',
}
</script>
<style lang='less' scoped>
.common-layout {
    .main {
        margin-top: 40px;
        max-height: calc(100vh - 50px);
        overflow: hidden;
    }
}
</style>