<script lang='ts' setup>

const nexusMods = useNexusMods()

watch([() => nexusMods.facets.categoryName, () => nexusMods.facets.languageName, () => nexusMods.facets.tag, () => nexusMods.sort], () => {
    nexusMods.search()
})

const sortList = [
    { label: 'Update time', value: { updatedAt: { direction: "DESC" } } },
    { label: 'Date Published', value: { createdAt: { direction: "DESC" } } },
    { label: 'Endorsements', value: { endorsements: { direction: "DESC" } } },
    { label: 'Downloads', value: { downloads: { direction: "DESC" } } },
    { label: 'Unique Downloads', value: { uniqueDownloads: { direction: "DESC" } } },
    { label: 'Mod Name', value: { name: { direction: "DESC" } } },
    { label: 'File Size', value: { size: { direction: "DESC" } } },
    { label: 'Lest Comment', value: { lastComment: { direction: "DESC" } } },
    // { label: 'Random', value: { random: {} } },
]

</script>
<template>
    <v-col cols="12">
        <v-row>
            <v-col cols="2">
                <el-select v-model="nexusMods.sort" value-key="label">
                    <el-option v-for="item in sortList" :key="item.label" :label="$t(item.label)"
                        :value="item"></el-option>
                </el-select>
            </v-col>
            <v-col cols="2">
                <el-select v-model="nexusMods.facets.categoryName" multiple filterable>
                    <el-option v-for="(item, key) in nexusMods.categoryName" :key="key" :value="key" :label="key">
                        {{ `${key} (${item})` }}
                    </el-option>
                </el-select>
            </v-col>
            <v-col cols="2">
                <el-select v-model="nexusMods.facets.languageName" multiple filterable>
                    <el-option v-for="(item, key) in nexusMods.languageName" :key="key" :value="key" :label="key">
                        {{ `${key} (${item})` }}
                    </el-option>
                </el-select>
            </v-col>
            <v-col cols="2">
                <el-select v-model="nexusMods.facets.tag" multiple filterable>
                    <el-option v-for="(item, key) in nexusMods.tag" :key="key" :value="key" :label="key">
                        {{ `${key} (${item})` }}
                    </el-option>
                </el-select>
            </v-col>
        </v-row>
    </v-col>
</template>
<script lang='ts'>

export default {
    name: 'NexusModsFilter',
}
</script>
<style lang='less' scoped></style>
