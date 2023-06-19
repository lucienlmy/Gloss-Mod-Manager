<script lang='ts' setup>
import { IFileTreeNode } from '@src/model/Interfaces';
import { useManager } from '@src/stores/useManager';
import { ref } from 'vue'
import { ipcRenderer } from "electron";
import { FileHandler } from '@src/model/FileHandler'

const manager = useManager()
const terr = ref()

function convertToFileTree(files: string[]): IFileTreeNode[] {
    if (!files) return []
    const root: IFileTreeNode[] = [];
    for (const file of files) {
        // const parts = file.split('/');
        const parts = file.split(/[\/|\\]/);
        let currentLevel = root;
        for (let i = 0; i < parts.length; i++) {
            const existingPath = parts.slice(0, i + 1).join('/');
            const currNodeIdx = currentLevel.findIndex(node => node.path === existingPath);
            if (currNodeIdx >= 0) { // Node already exists
                currentLevel = currentLevel[currNodeIdx].children ?? [];
            } else { // Node doesn't exist yet, create a new one
                const newNode: IFileTreeNode = {
                    label: parts[i],
                    path: existingPath,
                    checked: true,
                    children: []
                }
                currentLevel.push(newNode);
                currentLevel = newNode.children as IFileTreeNode[];
            }
        }
    }
    return root;
}

function selectDirectory() {
    ipcRenderer.invoke("select-file", {
        properties: ['openDirectory'],
        filters: [],
        title: "选择Mod根目录"
    }).then((res) => {
        if (res.length > 0) {

            let files = FileHandler.getAllFiles(res[0])
            console.log(files);
            fileTree.value = convertToFileTree(files)
        }

    })
}

let fileTree = ref(convertToFileTree(manager.packInfo.modFiles))

function getCheckedNodes(leafOnly: boolean, includeHalfChecked: boolean): IFileTreeNode[] {
    return terr.value.getCheckedNodes(leafOnly, includeHalfChecked)
}

defineExpose({
    getCheckedNodes
})

</script>
<template>
    <v-card>
        <v-card-title class="title">
            <div class="left">文件列表</div>
            <div class="right">
                <v-chip label variant="text" append-icon="mdi-folder-open-outline" @click="selectDirectory">选择目录</v-chip>
            </div>
        </v-card-title>
        <v-card-text>
            <el-tree v-if="fileTree.length > 0" ref="terr" :data="fileTree" :default-checked-keys="[fileTree[0].path]"
                node-key="path" show-checkbox />
        </v-card-text>
    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'ContentPackFiles',
}
</script>
<style lang='less' scoped>
.title {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left {
        flex: 1 1 auto;
    }

    .right {
        flex: 0 0 auto;
    }
}
</style>