<script lang='ts' setup>
import { useBackupGame } from '@src/stores/useBackupGame';
import { watch } from "vue";

import BackupList from '@src/components/Backup/BackupList.vue'
import { ElMessageBox } from 'element-plus';
import { IArchive } from '@src/model/Interfaces';
import { useI18n } from 'vue-i18n';


const backupGame = useBackupGame()
const { t } = useI18n()

backupGame.getBackupList()

watch(() => backupGame.backupFileList, () => {
    backupGame.saveBackupList()
}, { deep: true })

function del(item: IArchive) {
    ElMessageBox.confirm(t("Are you sure you want to delete this backup?")).then(() => {
        backupGame.delBackup(item)
    }).catch(() => { })
}

function restoring(item: IArchive) {
    ElMessageBox.confirm(t("Are you sure you want to restore this backup?")).then(() => {
        backupGame.restoringBackup(item)
    }).catch(() => { })
}

</script>
<template>
    <v-card :title="t('Backup List')">
        <v-card-text>
            <BackupList v-if="backupGame.backupFileList.length > 0" v-for="item in backupGame.backupFileList"
                :item="item" :key="item.time" @del="del(item)" @restoring="restoring(item)" />
            <el-empty v-else :description="t('No backup yet')" />
        </v-card-text>
    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'GameBackup',
}
</script>
<style lang='less' scoped></style>