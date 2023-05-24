<script lang='ts' setup>
import { ref, computed, watch } from "vue";
import marked from '@src/plugins/marked';
import { useI18n } from "vue-i18n";
import { Analytics } from "@src/model/Analytics"

Analytics.about()

let readme = ref('')
const { locale } = useI18n()

let readmeFile = computed(() => {
    // console.log(locale.value);
    if (locale.value == "zh_CN") return 'README.md'
    return `README_${locale.value}.md`
})

function getReadme() {
    fetch(readmeFile.value)
        .then(res => res.text())
        .then(text => {
            readme.value = marked(text)
        })
}

watch(() => readmeFile.value, () => {
    getReadme()
})
getReadme()

</script>
<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" class="about">
                <div class="markdown-body" v-html="readme"></div>
            </v-col>
        </v-row>
    </v-container>
</template>
<script lang='ts'>

export default {
    name: 'About',
}
</script>
<style lang='less' scoped>
.about {
    padding: 1rem;
    overflow: auto;
    max-height: calc(100vh - 100px);

    .markdown-body {
        background-color: transparent;
    }
}
</style>