<script lang='ts' setup>
import { useDownload } from '@src/stores/useDownload';
import AddTaskGlossMod from "@src/components/Download/AddTask/GlossMod.vue"
import AddTaskGitHub from "@src/components/Download/AddTask/GitHub.vue"
import AddCustomize from "@src/components/Download/AddTask/Customize.vue"

const download = useDownload()



</script>
<template>
    <v-dialog v-model="download.showAddTaskDialog" persistent width="900px">
        <template v-slot:activator="{ props }">
            <v-chip append-icon="mdi-plus" v-bind="props" label variant="text"> 新建下载</v-chip>
        </template>
        <v-card>
            <v-card-title>
                <v-col cols="12" class="top">
                    <div class="title">
                        <div class="text"> 新建下载 </div>
                    </div>
                    <div class="close">
                        <v-chip label append-icon="mdi-close" @click="download.showAddTaskDialog = false"
                            variant="text">{{ $t('Close') }}</v-chip>
                    </div>
                </v-col>
                <v-col cols="12">
                    <v-chip-group v-model="download.addTaskTab" mandatory>
                        <v-chip label value="GlossMod" variant="text">{{ $t('3DM Mods') }}</v-chip>
                        <v-chip label value="GitHub" variant="text">{{ $t('GitHub') }}</v-chip>
                        <v-chip label value="Customize" variant="text">{{ $t('Customize') }}</v-chip>
                    </v-chip-group>
                </v-col>
            </v-card-title>
            <AddTaskGlossMod v-if="download.addTaskTab == 'GlossMod'"></AddTaskGlossMod>
            <AddTaskGitHub v-if="download.addTaskTab == 'GitHub'"></AddTaskGitHub>
            <AddCustomize v-if="download.addTaskTab == 'Customize'"></AddCustomize>
        </v-card>
    </v-dialog>
</template>
<script lang='ts'>

export default {
    name: 'DownloadAddTask',
}
</script>
<style lang='less' scoped></style>