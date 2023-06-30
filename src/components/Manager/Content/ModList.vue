<script lang='ts' setup>
import type { IModInfo, IType } from '@src/model/Interfaces';
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { computed, watch, ref } from "vue";
import { AppAnalytics } from "@src/model/Analytics"

import ContentModMenu from '@src/components/Manager/Content/ModMenu.vue'

const props = defineProps<{
    mod: IModInfo
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
        AppAnalytics.sendEvent("install", `webid: ${props.mod.webId}`)
        // 安装
        type.value?.install(props.mod).then(res => {
            if (typeof (res) == 'boolean' && res == false) {
                props.mod.isInstalled = false
            }
        })
    } else {
        // 卸载
        type.value?.uninstall(props.mod).then(res => {
            if (typeof (res) == 'boolean' && res == false) {
                props.mod.isInstalled = false
            }
        })
    }
})

let exit_name = ref(false)

</script>
<template>
    <v-col cols="12">
        <v-row class="mod-list">
            <v-col cols="6" class="mod-name">
                <!-- 名称 -->
                <p v-if="!exit_name" @dblclick="exit_name = true" class="text-truncate" :title="mod.modName">
                    {{ mod.modName }} <v-btn variant="text" class="exit-btn" @click="exit_name = true"
                        icon="mdi-circle-edit-outline"></v-btn> </p>
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
</template>
<script lang='ts'>

export default {
    name: 'ContentModList',
}
</script>
<style lang='less' scoped>
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
</style>