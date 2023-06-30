<script lang='ts' setup>
import type { IFileTreeNode, IModInfo } from '@src/model/Interfaces';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { ref, computed } from 'vue'
import { ElMessage } from "element-plus";
import { ipcRenderer } from 'electron';
import PackRequirements from '@src/components/Manager/Content/Pack/Requirements.vue'
import ContentPackFiles from '@src/components/Manager/Content/Pack/Files.vue'
import { Unzipper } from '@src/model/Unzipper'
import { join, basename } from 'path'
import { useI18n } from 'vue-i18n';

const props = defineProps(['mod'])
const manager = useManager()
const settings = useSettings()
const { t } = useI18n()
const files = ref()
const packling = ref(false)
const packlingProgress = ref(0)
const packlingNow = ref('')
const gameList = computed(() => {

    const list = manager.supportedGames.map((item) => ({
        name: t(item.gameName),
        id: item.gameID,
    }));
    return list
})

manager.packInfo = {
    ...props.mod
}
manager.packInfo.gameID = settings.settings.managerGame?.gameID

const modType = computed(() => {
    return manager.supportedGames.find(item => item.gameID == manager.packInfo.gameID)?.modType
})

async function pack() {
    // 检查依赖是否合法
    manager.packInfo.corePlugins?.forEach(async item => {
        if (isNaN(Number(item.id))) {
            ElMessage.error("依赖格式错误! 应该为3DM Mod站的ModID! 不知道就为空, 不要乱填！")
            return
        }
        let data = await ipcRenderer.invoke("get-mod-data", { id: item.id })
        if (!data) {
            ElMessage.error(`依赖 ${item.name} 未找到, 请输入正确的依赖ID`)
            return
        }
        let resource_url = data.mods_resource_url.replace("http://mod.3dmgame.com", "https://mod.3dmgame.com")
        if (!resource_url.includes("https://mod.3dmgame.com")) {
            ElMessage.error(`依赖 ${item.name} 未使用本地文件, 无法作为依赖使用`)
        }
    })

    // 获取选择的文件列表
    let filesList = (files.value.getCheckedNodes(true, false) as IFileTreeNode[]).map(item => item.path)
    // console.log(filesList);
    if (filesList.length == 0) {
        ElMessage.error("请至少选择1个文件")
        return
    }

    // 选择导出目录
    ipcRenderer.invoke("save-file", {
        properties: ['showOverwriteConfirmation'],
        filters: [
            { name: 'Gloss Mod Manager Pack', extensions: ['gmm'] }
        ],
        title: '选择导出路径',
        defaultPath: `${manager.packInfo.modName}.gmm`
    }).then(async (res: string) => {
        if (res != '') {
            packling.value = true
            manager.packInfo.modFiles = filesList.map(item => setFilePath(item))
            Unzipper.createZip(res, manager.packInfo)
            for (let index = 0; index < filesList.length; index++) {
                try {
                    const item = filesList[index];
                    packlingNow.value = basename(item)
                    let filePath = join(manager.modStorage, props.mod.id.toString(), item)
                    await Unzipper.addAndRenameToZip(res, filePath, setFilePath(item))
                    packlingProgress.value = Math.round((index + 1) / filesList.length * 100)
                } catch (error) {
                    ElMessage.error(`错误: ${error}`)
                }

            }
            packling.value = false
            manager.packDialog = false
            ElMessage.success("打包完成！")
        }
    })
}

function setFilePath(item: string) {
    // 判断开头是否有 Files
    if (item.startsWith("Files")) {
        return item
    } else {
        return join("Files", item)
    }
}

</script>
<template>
    <!-- <v-list-item append-icon="mdi-package-variant-closed" :title="$t('Pack')" @click="pack"></v-list-item> -->
    <v-dialog v-model="manager.packDialog" persistent width="900px">
        <template v-slot:activator="{ props }">
            <v-list-item append-icon="mdi-package-variant-closed" :title="$t('Pack')" v-bind="props"></v-list-item>
        </template>
        <v-card class="pack">
            <v-card-text>
                <v-col cols="12" class="top">
                    <div class="title">
                        <div class="text">
                            {{ $t('Pack') }}
                        </div>
                    </div>
                    <div class="close">
                        <v-chip label append-icon="mdi-close" @click="manager.packDialog = false"
                            variant="text">{{ $t('Close') }}</v-chip>
                    </div>
                </v-col>
                <v-divider></v-divider>
                <v-col cols="12" class="info">
                    <v-row>
                        <v-col cols="12">
                            <v-text-field :label="$t('Name')" variant="solo-filled" v-model="manager.packInfo.modName"
                                hide-details="auto"></v-text-field>
                        </v-col>
                        <v-col cols="6">
                            <v-text-field variant="solo-filled" :label="$t('Desc')" hide-details="auto"
                                v-model="manager.packInfo.modDesc"></v-text-field>
                        </v-col>
                        <v-col cols="3">
                            <v-select v-model="manager.packInfo.gameID" variant="solo-filled" :items="gameList"
                                :hide-details="true" item-title="name" item-value="id">
                            </v-select>
                        </v-col>
                        <v-col cols="3">
                            <v-text-field variant="solo-filled" :label="$t('Author')" hide-details="auto"
                                v-model="manager.packInfo.modAuthor"></v-text-field>
                        </v-col>
                        <v-col cols="3">
                            <v-text-field variant="solo-filled" :label="$t('Version')" hide-details="auto"
                                v-model="manager.packInfo.modVersion"></v-text-field>
                        </v-col>
                        <v-col cols="3">
                            <v-select v-model="manager.packInfo.modType" variant="solo-filled" :items="modType"
                                :hide-details="true" item-title="name" item-value="id">
                            </v-select>
                        </v-col>
                        <v-col cols="3">
                            <v-text-field variant="solo-filled" :label="$t('Weight')" hide-details="auto"
                                v-model="manager.packInfo.weight"></v-text-field>
                        </v-col>
                        <v-col cols="3">
                            <v-text-field variant="solo-filled" label="webID"
                                v-model="manager.packInfo.webId"></v-text-field>
                        </v-col>
                        <v-col cols="6">
                            <PackRequirements></PackRequirements>
                        </v-col>
                        <v-col cols="6">
                            <ContentPackFiles ref="files"></ContentPackFiles>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" class="pack-btn">
                            <v-btn variant="text" append-icon="mdi-package-variant-closed" @click="pack">打包</v-btn>
                        </v-col>
                    </v-row>
                </v-col>
            </v-card-text>
        </v-card>
        <v-dialog v-model="packling" persistent width="400px">
            <v-card>
                <v-card-text class="packling">
                    <div class="packling-title">打包中: {{ packlingProgress }}%</div>
                    <div class="packling-progress">
                        <v-progress-linear v-model="packlingProgress" color="#26C6DA"></v-progress-linear>
                    </div>
                    <div class="packling-now">正在处理:
                        <p>{{ packlingNow }}</p>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-dialog>
</template>
<script lang='ts'>

export default {
    name: 'ContentPack',
}
</script>
<style lang='less' scoped>
.pack {
    // padding: 1rem;

    .top {
        display: flex;
        align-items: center;

        .title {
            flex: 1 1 auto;
            display: flex;
            align-items: center;
        }
    }

    .pack-btn {
        text-align: right;
    }
}

.packling {
    display: flex;
    flex-direction: column;

    &>div {
        margin: 0.5rem 0;
    }

    .packling-now {
        font-size: 12px;
    }
}
</style>