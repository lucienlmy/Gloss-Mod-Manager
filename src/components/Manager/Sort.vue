<script lang='ts' setup>
import { useManager } from '@src/stores/useManager';

const manager = useManager()

enum sort {
    name = 1,
    type = 2,
    author = 3,
    version = 4,
    state = 5,
    Tag = 6
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
        case sort.Tag:
            // 根据 Tags 排序 顺序按照 manager.tags 中的顺序
            // 如果没有 Tags 则排在最后

            /**
             * let aIndex = manager.tags.findIndex(item => item.name == (a.tags ? [0]?.name))
                let bIndex = manager.tags.findIndex(item => item.name == (b.tags ? [0]?.name))
                if (aIndex == -1) aIndex = manager.tags.length
                if (bIndex == -1) bIndex = manager.tags.length 
                return aIndex - bIndex
             */

            manager.managerModList.sort((a, b) => {
                let aTags = a.tags ?? [{ name: '', color: '' }]
                let bTags = b.tags ?? [{ name: '', color: '' }]
                let aIndex = aTags.map(item => manager.tags.findIndex(tag => tag.name == item.name)).sort((a, b) => a - b)
                let bIndex = bTags.map(item => manager.tags.findIndex(tag => tag.name == item.name)).sort((a, b) => a - b)

                if (aIndex[0] == -1) aIndex[0] = manager.tags.length
                if (bIndex[0] == -1) bIndex[0] = manager.tags.length

                return aIndex[0] - bIndex[0]
            })
            break;
        default:
            break;
    }
}

</script>
<template>
    <v-menu open-on-hover location="end">
        <template v-slot:activator="{ props }">
            <v-list-item :title="$t('sort by')" v-bind="props" value="0" append-icon="mdi-menu-right">
            </v-list-item>
        </template>
        <v-card>
            <v-list>
                <v-list-item :title="$t('sort by {0}', [$t('Name')])" @click="byName(sort.name)"></v-list-item>
                <v-list-item :title="$t('sort by {0}', [$t('Type')])" @click="byName(sort.type)"></v-list-item>
                <v-list-item :title="$t('sort by {0}', [$t('Author')])" @click="byName(sort.author)"></v-list-item>
                <v-list-item :title="$t('sort by {0}', [$t('Version')])" @click="byName(sort.version)"></v-list-item>
                <v-list-item :title="$t('sort by {0}', [$t('state')])" @click="byName(sort.state)"></v-list-item>
                <v-list-item :title="$t('sort by {0}', [$t('Tag')])" @click="byName(sort.Tag)"></v-list-item>
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