<script lang='ts' setup>
import { useSettings } from '@src/stores/useSettings';


const settings = useSettings()

let config = settings.getConfig()
console.log(config);


</script>
<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <h1 class="title">软件设置</h1>
            </v-col>
            <v-col cols="12">
                <v-text-field label="储存位置" v-model="settings.settings.modStorageLocation">
                    <template v-slot:append-inner>
                        <v-btn variant="text">选择</v-btn>
                    </template>
                </v-text-field>
            </v-col>
        </v-row>
    </v-container>
</template>
<script lang='ts'>

export default {
    name: 'Settings',
}
</script>
<style lang='less' scoped>
.title {
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 1rem;
}
</style>