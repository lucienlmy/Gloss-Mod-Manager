<script lang='ts' setup>
import { useManager } from '@src/stores/useManager';

const manager = useManager()

enum sort {
    name = 1,
    type = 2,
    author = 3,
    version = 4,
    state = 5,
}

function byName(b: sort) {
    switch (b) {
        case sort.name:
            manager.managerModList.sort((a, b) => a.modName.localeCompare(b.modName))
            break;
        case sort.type:
            manager.managerModList.sort((a, b) => (a.modType ?? 0) - (b.modType ?? 0))
            break;
        case sort.author:
            manager.managerModList.sort((a, b) => (a.modAuthor ?? '').localeCompare((b.modAuthor ?? '')))
            break;
        case sort.version:
            manager.managerModList.sort((a, b) => a.modVersion.localeCompare(b.modVersion))
            break;
        case sort.state:
            manager.managerModList.sort((a, b) => (b.isInstalled ? 1 : 0) - (a.isInstalled ? 1 : 0))
            break;
        default:
            break;
    }
}

</script>
<template>
    <v-menu open-on-hover location="end">
        <template v-slot:activator="{ props }">
            <v-list-item title="排序" v-bind="props" value="0" append-icon="mdi-menu-right">
            </v-list-item>
        </template>
        <v-card>
            <v-list>
                <v-list-item title="按名称排序" @click="byName(sort.name)"></v-list-item>
                <v-list-item title="按类型排序" @click="byName(sort.type)"></v-list-item>
                <v-list-item title="按作者排序" @click="byName(sort.author)"></v-list-item>
                <v-list-item title="按版本排序" @click="byName(sort.version)"></v-list-item>
                <v-list-item title="按状态排序" @click="byName(sort.state)"></v-list-item>
            </v-list>
        </v-card>
    </v-menu>
</template>
<script lang='ts'>

export default {
    name: 'ManagerSort',
}
</script>
<style lang='less' scoped></style>