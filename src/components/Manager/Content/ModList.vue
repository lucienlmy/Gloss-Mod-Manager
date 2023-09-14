<script lang='ts' setup>
import type { IModInfo, IType } from '@src/model/Interfaces';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { computed, watch, ref } from "vue";
import { AppAnalytics } from "@src/model/Analytics"

import ContentModMenu from '@src/components/Manager/Content/ModMenu.vue'
import { FileHandler } from '@src/model/FileHandler';

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
    // console.log(props.mod.isInstalled);

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

let exit_name = ref(false)
// let dragIndex = 0
// let index = props.index


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
        <v-col cols="12">
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
                    <v-select v-model="mod.modType" variant="solo" :items="settings.settings.managerGame?.modType"
                        :hide-details="true" item-title="name" item-value="id">
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
    height: 80px;

    // &.new-version {
    //     background-color: rgb(119 39 39 / 39%);
    // }


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

    .moveing {
        opacity: 0;
    }
}
</style>