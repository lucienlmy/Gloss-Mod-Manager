<script lang='ts' setup>
import { ref, computed, watch } from "vue";
import marked from '@src/plugins/marked';
import { useI18n } from "vue-i18n";
import { useTheme } from 'vuetify'

const theme = useTheme()


if (theme.name.value == 'dark') {
    import('github-markdown-css/github-markdown-dark.css');
} else {
    import('github-markdown-css/github-markdown-light.css');
}

let readme = ref('')
const { locale } = useI18n()

let readmeFile = computed(() => {
    // console.log(locale.value);
    // let host = `https://raw.githubusercontent.com/GlossMod/Gloss-Mod-Manager-info/main/`
    let file = `README_${locale.value}.md`
    if (locale.value == "en_US") file = 'README.md'
    return `https://p.aoe.top/githubusercontent/GlossMod/Gloss-Mod-Manager-info/main/${file}`
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