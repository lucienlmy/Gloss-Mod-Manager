<script lang='ts' setup>

</script>
<template>
    <v-card>
        <v-card-title>{{ $t('Partner') }}</v-card-title>
        <v-card-text>
            <v-row>
                <v-col cols="4">
                    <a href="https://mod.3dmgame.com/">
                        <v-img src="imgs/3DMGAME.webp" alt="3DMGAME"></v-img>
                    </a>
                </v-col>
            </v-row>

        </v-card-text>
    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'Sponsor',
}
</script>
<style lang='less' scoped>
a {
    transition: 1s;

    :hover {
        opacity: .8;
    }
}
</style>