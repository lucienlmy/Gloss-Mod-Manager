<script lang='ts' setup>
import path from 'path'

import ContentModList from '@src/components/Manager/Content/ModList.vue'
import { useManager } from '@src/stores/useManager';

const manager = useManager()

function test() {
    console.log(__dirname);
}


// 移入时触发 第一次
function dragenter(event: DragEvent) {
}
// 移出时触发
function dragleave(event: DragEvent) {
}
// 在元素内松手时触发
function drop(event: DragEvent) {
    let files = event.dataTransfer?.files
    if (files) {
        // console.log(files);
        upFile(files[0])
    }
}
// // 拖入时触发 一直
function dragover() { }

function upFile(file: File) {
    console.log(file);

}

</script>
<template>
    <div class="list-wrap" @dragenter.prevent="dragenter($event)" @dragleave.prevent="dragleave"
        @drop.prevent="drop($event)" @dragover.prevent="dragover">
        <div class="mod-list" v-if="manager.managerModList.length > 0">
            <ContentModList v-for="item in manager.managerModList" :mod="item"></ContentModList>
        </div>
        <div class="empty" v-else>
            <div class="empty-hint" @click="test">将Mod压缩包拖拽到这里进行管理</div>
        </div>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'ManagerContentListWrapper',
}
</script>
<style lang='less' scoped>
.list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #363636;
    margin-bottom: 10px;
    padding: 10px;
    cursor: move;
}
</style>