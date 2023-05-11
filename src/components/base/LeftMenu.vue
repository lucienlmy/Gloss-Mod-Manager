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
        title: "下载管理",
        icon: "mdi-download",
        path: "/Download"
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

function toTop() {
    // 返回顶部
    const currentScrollTop = document.documentElement.scrollTop;
    if (currentScrollTop > 0) {
        window.requestAnimationFrame(toTop);
        document.documentElement.scrollTop -= currentScrollTop / 8;
    }
}

function toBottom() {
    // 前往底部
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    document.documentElement.scrollTop = scrollHeight - clientHeight;

}

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
                <v-list-item @click="toTop" prepend-icon="mdi-arrow-up-bold"></v-list-item>
                <v-list-item @click="toBottom" prepend-icon="mdi-arrow-down-bold"></v-list-item>
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