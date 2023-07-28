<script lang='ts' setup>
import ContentModList from '@src/components/Manager/Content/ModList.vue'
import { useManager } from '@src/stores/useManager';
import { useSettings } from '@src/stores/useSettings';
import { ref } from "vue";

const manager = useManager()
const settings = useSettings()
let loading = ref(false)
// 移入时触发 第一次
function dragenter(event: DragEvent) {
}
// 移出时触发
function dragleave(event: DragEvent) {
}

// 拖入时触发 一直
function dragover() { }


// 拖拽添加文件
async function drop(event: DragEvent) {
    let files = event.dataTransfer?.files
    if (files) {
        loading.value = true
        for (let i = 0; i < files.length; i++) {
            await manager.addModFile(files[i].path)
        }
        loading.value = false
    }
    // console.log(manager.managerModList);
}

</script>
<template>
    <div class="list-wrap" @dragenter.prevent="dragenter($event)" @dragleave.prevent="dragleave"
        @drop.prevent="drop($event)" @dragover.prevent="dragover">
        <v-card :loading="loading">
            <template v-slot:loader="{ isActive }">
                <v-progress-linear :active="isActive" color="deep-purple" height="4" indeterminate></v-progress-linear>
            </template>
            <div class="mod-list" v-if="manager.filterModList.length > 0">
                <v-col cols="12">
                    <v-row>
                        <v-col cols="6">{{ $t('Name') }}</v-col>
                        <v-col cols="1">{{ $t('Version') }}</v-col>
                        <v-col cols="2" class="text-center">{{ $t('Type') }}</v-col>
                        <v-col cols="2" class="text-center">{{ $t('Status') }}</v-col>
                        <v-col cols="1" class="text-center">{{ $t('Action') }}</v-col>
                    </v-row>
                </v-col>
                <TransitionGroup name="list" tag="div" class="container">
                    <ContentModList v-for="(item, index) in manager.filterModList" :key="item.md5" :mod="item"
                        :index="index"></ContentModList>
                </TransitionGroup>
            </div>
            <div class="empty" v-else>
                <div class="empty-hint" @click="manager.selectMoeFiles">
                    <p>{{ $t('Drag and drop the Mod compressed package here for management') }}</p>
                    <p>{{ $t('Supports zpi, rar, 7z file types') }}</p>
                </div>
            </div>
        </v-card>

    </div>
</template>
<script lang='ts'>

export default {
    name: 'ManagerContentListWrapper',
}
</script>
<style lang='less' scoped>
.list-wrap {
    .mod-list {
        padding: 1rem;
    }
}

.empty-hint {
    flex-direction: column;
}

.list-move,
/* 对移动中的元素应用的过渡 */
.list-enter-active,
.list-leave-active {
    transition: all 0.2s ease;
}
</style>