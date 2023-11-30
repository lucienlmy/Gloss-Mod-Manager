<script lang='ts' setup>
import { useTheme } from 'vuetify'
import { computed } from "vue";
import marked from '@src/plugins/marked';

const theme = useTheme()


if (theme.name.value == 'dark') {
    import('github-markdown-css/github-markdown-dark.css');
} else {
    import('github-markdown-css/github-markdown-light.css');
}

const props = defineProps<{
    text: string
}>()


const readme = computed(() => {
    return marked(props.text)
})

</script>
<template>
    <div class="markdown-body" v-html="readme"></div>
</template>
<script lang='ts'>

export default {
    name: 'Markdown',
}
</script>
<style lang='less' scoped>
.markdown-body {
    background-color: transparent;
}
</style>