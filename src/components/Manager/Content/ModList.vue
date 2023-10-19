<script lang='ts' setup>
import type { IModInfo, IType } from '@src/model/Interfaces';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { computed, watch, ref } from "vue";
import { AppAnalytics } from "@src/model/Analytics"

import ContentModMenu from '@src/components/Manager/Content/ModMenu.vue'
import { FileHandler } from '@src/model/FileHandler';
import { ElMessageBox } from 'element-plus';

const props = defineProps<{
    mod: IModInfo,
    index: number
}>()

const manager = useManager()
const settings = useSettings()


if (!props.mod.modType) {
    // console.log(settings.settings.managerGame);
    props.mod.modType = settings.settings.managerGame?.checkModType(props.mod)
}

let type = computed<IType | undefined>(() => {
    return settings.settings.managerGame?.modType.find((item) => {
        return item.id == props.mod.modType
    })
})

watch(() => props.mod.isInstalled, () => {
    if (props.mod.isInstalled) {
        FileHandler.writeLog(`安装: ${props.mod.modName}`)
        AppAnalytics.sendEvent("install", `webid: ${props.mod.webId}`)
        // 安装
        type.value?.install(props.mod).then(res => {
            if (typeof (res) == 'boolean' && res == false) {
                props.mod.isInstalled = false
            }
        })
    } else {
        FileHandler.writeLog(`卸载: ${props.mod.modName}`)
        // 卸载
        type.value?.uninstall(props.mod).then(res => {
            if (typeof (res) == 'boolean' && res == false) {
                props.mod.isInstalled = false
            }
        })
    }
})

let modType = computed({
    get: () => props.mod.modType,
    set: (value) => {
        if (props.mod.modType != 99) {
            ElMessageBox.confirm(`除非你真的知道自己在做什么, 否则不要随意修改类型, 不然会导致Mod失效!`).then(() => {
                props.mod.modType = value
            }).catch(() => {
                // props.mod.modType = ondValue
            })
        } else {
            props.mod.modType = value
        }
    }
})


let exit_name = ref(false)

function dragstart(e: any, index: number) {
    e.stopPropagation()
    manager.dragIndex = index
    setTimeout(() => {
        e.target.classList.add('moveing')
    }, 0)
}
function dragenter(e: any, index: number) {
    e.preventDefault()
    // 拖拽到原位置时不触发
    if (manager.dragIndex !== index) {

        const source = manager.managerModList[manager.dragIndex];

        manager.managerModList.splice(manager.dragIndex, 1);
        manager.managerModList.splice(index, 0, source);

        // 更新节点位置
        manager.dragIndex = index
    }
}
function dragover(e: any) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
}
function dragend(e: any) {
    e.target.classList.remove('moveing')
}


</script>
<template>
    <div class="wrap" v-if="mod?.id" :class="{ 'new-version': mod.isUpdate }">
        <el-col :span="24" v-if="settings.settings.fold">
            <!-- 小列表 -->
            <el-row draggable="true" @dragstart="dragstart($event, index)" @dragenter="dragenter($event, index)"
                @dragend="dragend" @dragover="dragover">
                <el-col :span="12">
                    <p v-if="!exit_name" @dblclick="exit_name = true" class="text-truncate" :title="mod.modName">
                        {{ mod.modName }}
                    </p>
                    <el-input v-else @blur="exit_name = false" @keydown.enter="exit_name = false"
                        v-model="mod.modName"></el-input>
                </el-col>
                <el-col :span="2">{{ mod.modVersion }}</el-col>
                <el-col :span="4">
                    <el-select v-model="modType" :disabled="mod.isInstalled">
                        <el-option v-for="item in settings.settings.managerGame?.modType" :key="item.id" :label="item.name"
                            :value="item.id" />
                    </el-select>
                </el-col>
                <el-col :span="4" class="small-install">
                    <el-switch v-model="mod.isInstalled" size="small"
                        :active-text="mod.isInstalled ? $t('Installed') : $t('Uninstalled')" />
                </el-col>
                <el-col :span="2">
                    <ContentModMenu :mod="mod"></ContentModMenu>
                </el-col>
            </el-row>
        </el-col>
        <v-col cols="12" v-else>
            <!-- :no-gutters="manager.fold" -->
            <v-row class="mod-list" draggable="true" @dragstart="dragstart($event, index)"
                @dragenter="dragenter($event, index)" @dragend="dragend" @dragover="dragover">
                <v-col cols="6" class="mod-name">
                    <!-- 名称 -->
                    <p v-if="!exit_name" @dblclick="exit_name = true" class="text-truncate" :title="mod.modName">
                        {{ mod.modName }}
                        <!-- <v-btn variant="text" class="exit-btn" @click="exit_name = true" icon="mdi-circle-edit-outline"></v-btn> -->
                    </p>
                    <v-text-field v-else @blur="exit_name = false" @keydown.enter="exit_name = false" v-model="mod.modName"
                        variant="solo-filled" :hide-details="true"></v-text-field>
                </v-col>
                <v-col cols="1">{{ mod.modVersion }}</v-col>
                <v-col cols="2">
                    <!-- 类型 -->
                    <v-select v-model="modType" variant="solo" :items="settings.settings.managerGame?.modType"
                        :hide-details="true" item-title="name" item-value="id" :disabled="mod.isInstalled">
                        <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props" :title="$t(item.title)"></v-list-item>
                            <!-- <v-chip label variant="text" v-bind="props">{{ $t(item.title) }}</v-chip> -->
                        </template>
                    </v-select>
                </v-col>
                <v-col cols="2">
                    <!-- 安装 -->
                    <v-switch v-model="mod.isInstalled" :label="mod.isInstalled ? $t('Installed') : $t('Uninstalled')"
                        :hide-details="true" color="#0288D1"></v-switch>
                </v-col>
                <v-col cols="1">
                    <ContentModMenu :mod="mod"></ContentModMenu>
                </v-col>
            </v-row>
        </v-col>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'ContentModList',
}
</script>
<style lang='less' scoped>
.wrap {
    // height: 80px;

    // &.new-version {
    //     background-color: rgb(119 39 39 / 39%);
    // }

    .fold {
        padding-top: 0.1rem;
        padding-bottom: 0.1rem;
    }

    .mod-list {
        display: flex;
        align-items: center;
        transition: all 0.3s;



        &:hover {
            // 底部阴影
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        }

        .mod-name {
            .exit-btn {
                display: none;
            }

            &:hover {
                .exit-btn {
                    display: inline-grid;
                }
            }
        }


    }

    .small-install {
        display: flex;
        justify-content: center;
    }

    .moveing {
        opacity: 0;
    }
}
</style>