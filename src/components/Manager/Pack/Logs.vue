<script lang='ts' setup>
import { usePacks } from '@src/stores/usePacks';
import { ipcRenderer } from 'electron';
import { ElMessage } from 'element-plus';

const pack = usePacks()

</script>
<template>
    <v-card>
        <v-card-text>
            <v-textarea :label="$t('Logs')" v-model="pack.logText" variant="solo" readonly></v-textarea>
        </v-card-text>
    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'PackLogs',
}
</script>
<style lang='less' scoped>
.title {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
</style>