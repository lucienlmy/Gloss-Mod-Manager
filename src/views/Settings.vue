<script lang='ts' setup>

import SettingsBtn from '@src/components/Settings/SettingsBtn.vue'
import SettingsInput from '@src/components/Settings/SettingsInput.vue'
import { Analytics } from "@src/model/Analytics"

Analytics.setting()

</script>
<template>
    <v-container fluid>
        <SettingsInput></SettingsInput>
        <SettingsBtn></SettingsBtn>
    </v-container>
</template>
<script lang='ts'>

export default {
    name: 'Settings',
}
</script>
<style lang='less' scoped>
.title {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 0;
}
</style>