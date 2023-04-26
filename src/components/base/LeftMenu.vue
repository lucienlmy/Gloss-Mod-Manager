<script lang='ts' setup>
import { useMain } from '@src/stores/useMain';

let lists = [
    {
        title: '首页',
        icon: "mdi-home",
        path: '/'
    },
    {
        title: '模组管理',
        icon: "mdi-select-group",
        path: '/Manager'
    },
    {
        title: "游览模组",
        icon: "mdi-gamepad-circle",
        path: "/Explore"
    },
    {
        title: '工具设置',
        icon: "mdi-cog",
        path: '/Settings'
    },
    {
        title: '关于',
        icon: "mdi-information-slab-circle-outline",
        path: '/about'
    },
]

const main = useMain()

</script>
<template>
    <v-navigation-drawer v-model="main.leftMenu" :rail="main.leftMenuRail" permanent>
        <v-list>
            <v-list-item v-for="item in lists" :key="item.path" :to="item.path" :prepend-icon="item.icon"
                :title="item.title">
            </v-list-item>
        </v-list>
        <template v-slot:append>
            <v-list>
                <v-list-item @click="main.leftMenuRail = !main.leftMenuRail"
                    :prepend-icon="main.leftMenuRail ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'">
                </v-list-item>
            </v-list>
        </template>
    </v-navigation-drawer>
</template>
<script lang='ts'>

export default {
    name: 'LeftMenu',
}
</script>
<style lang='less' scoped>
.left-menu {
    height: calc(100vh - 50px);
}
</style>