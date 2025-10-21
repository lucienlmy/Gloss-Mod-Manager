<script lang="ts" setup>
const manager = useManager();
const settings = useSettings();

async function install(plugins: IGamePlugins) {
    let mod: any = {
        ...plugins,
        fileName: plugins.name,
        webId: plugins.web_id,
    };

    manager.updateMod(mod);
}

// 组件名称定义
defineOptions({
    name: "ManagerContentGamePlugins",
});
</script>

<template>
    <v-card
        variant="tonal"
        color="#FFAB00"
        v-if="manager.plugins.length > 0 && settings.settings.showPlugins"
    >
        <v-card-title
            >所需前置
            <v-chip
                color="#1E88E5"
                label
                variant="text"
                target="_blank"
                href="https://pan.aoe.top/GMM/Requirements"
                append-icon="mdi-open-in-new"
                >前置包
                <v-tooltip activator="parent" location="bottom"
                    >一键下载并安装所有前置</v-tooltip
                >
            </v-chip>
        </v-card-title>
        <v-card-text>
            <v-table density="compact" class="table">
                <thead>
                    <tr>
                        <th class="text-left">
                            {{ $t("Name") }}
                        </th>
                        <th class="text-left">
                            {{ $t("Action") }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in manager.plugins">
                        <td>
                            <v-chip
                                variant="text"
                                prepend-icon="mdi-help-circle-outline"
                            >
                                {{ item.name }}
                                <v-tooltip activator="parent" location="top">{{
                                    item.desc
                                }}</v-tooltip>
                            </v-chip>
                        </td>
                        <td>
                            <el-button @click="install(item)">安装</el-button>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </v-card-text>
    </v-card>
</template>

<style lang="less" scoped></style>
