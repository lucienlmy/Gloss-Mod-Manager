<script setup lang="ts">
import { useCounter } from '@src/stores/useCounter';

defineProps<{ msg: string }>()

const counter = useCounter()

let models = [
    {
        name: "element-plus",
        link: 'https://element-plus.gitee.io/zh-CN/'
    },
    {
        name: "pinia",
        link: 'https://pinia.vuejs.org/zh/'
    },
    {
        name: "vue-router",
        link: 'https://router.vuejs.org/zh/'
    },
    {
        name: "less",
        link: 'https://less.bootcss.com/'
    },
    {
        name: 'marked',
        link: 'https://marked.js.org/#/README.md#README.md'
    },
    {
        name: "github-markdown-css",
        link: 'https://github.com/sindresorhus/github-markdown-css'
    }
]

</script>

<template>
    <div class="hello-world">
        <h1>{{ msg }}</h1>

        <div class="card">
            <el-button @click="counter.increment">count is {{ counter.count }}</el-button>
            <p>double count is {{ counter.double }}</p>
        </div>
        <el-divider></el-divider>
        <p>在Electron 、 Vite 、 Vue的基础上另外集成了:</p>
        <p>
            <el-link class="model-list" v-for="item in models" :href="item.link"> {{ item.name }}</el-link>
        </p>
    </div>
</template>

<style lang='less' scoped>
.hello-world {
    text-align: center;

    .model-list {
        margin-right: 10px;
        color: #9FEAF9;
    }
}
</style>
