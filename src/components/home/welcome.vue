<script lang='ts' setup>
import { useRouter } from 'vue-router';


const router = useRouter()

let list = [
    { title: '管理模组', icon: 'mdi-select-group', to: '/Manager' },
    { title: '游览模组', icon: 'mdi-gamepad-circle', to: '/Explore' },
    { title: '配置GMM', icon: 'mdi-cog', to: '/Settings' },

]

function to(path: string) {
    router.push(path)
}

</script>
<template>
    <v-row>
        <v-col cols="12">
            <v-card title="欢迎使用GMM,在这里你可以">
                <v-row>
                    <v-col cols="12" sm="4" v-for="item in list" :key="item.title">
                        <div class="list" @click="to(item.to)"> <v-icon :icon="item.icon"></v-icon> {{ item.title }}</div>
                    </v-col>
                </v-row>
            </v-card>
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'Welcome',
}
</script>
<style lang='less' scoped>
.list {

    line-height: 2rem;
    padding: 2rem 2.5rem;
    cursor: pointer;
    transition: background-color 0.3s ease-in-out;

    &:hover {
        background-color: rgba(0, 0, 0, 0.6);
    }

}
</style>