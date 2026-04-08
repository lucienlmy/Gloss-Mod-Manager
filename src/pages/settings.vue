<script setup lang="ts">
import { ElMessage } from "element-plus-message";
import { AutoStart } from "@/lib/auto-start";
import { PersistentStore } from "@/lib/persistent-store";
import { Theme, type ThemeMode } from "@/lib/theme";

const { theme, setTheme } = Theme.use();
const { autoStart, autoStartLoading, setAutoStart } = AutoStart.use();

const themeModel = computed<ThemeMode>({
    get: () => theme.value,
    set: (value) => setTheme(value),
});

const autoStartModel = computed({
    get: () => autoStart.value,
    set: async (value: boolean) => {
        try {
            await setAutoStart(value);
        } catch (error: unknown) {
            console.error("设置开机自启失败");
            console.error(error);
            ElMessage.error("设置开机自启失败");
        }
    },
});
const defaultStartPage = PersistentStore.useValue<string>(
    "defaultStartPage",
    "/",
);

const autoAddAfterDownload = PersistentStore.useValue<boolean>(
    "autoAddAfterDownload",
    true,
);
const selectGameByFolder = PersistentStore.useValue<boolean>(
    "selectGameByFolder",
    false,
);
const debugMode = PersistentStore.useValue<boolean>("debugMode", false);
const modifiableDuringGame = PersistentStore.useValue<boolean>(
    "modifiableDuringGame",
    false,
);
const showPreloadList = PersistentStore.useValue<boolean>(
    "showPreloadList",
    true,
);
const disableSymlinkInstall = PersistentStore.useValue<boolean>(
    "disableSymlinkInstall",
    false,
);
</script>
<template>
    <div class="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <CardTitle>
                    <h1>设置</h1>
                </CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <h3>基础配置</h3>
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="flex flex-col gap-8">
                        <div class="grid grid-cols-4 items-center gap-8">
                            <div class="flex gap-2 items-center">
                                <Label
                                    for="theme-model"
                                    class="text-sm font-medium"
                                    >主题</Label
                                >
                                <Select id="theme-model" v-model="themeModel">
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择主题" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="system"
                                            >跟随系统</SelectItem
                                        >
                                        <SelectItem value="light">
                                            浅色
                                        </SelectItem>
                                        <SelectItem value="dark"
                                            >深色</SelectItem
                                        >
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label
                                    for="default-start-page"
                                    class="text-sm font-medium"
                                    >默认启动页</Label
                                >
                                <Select
                                    id="default-start-page"
                                    v-model="defaultStartPage">
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder="选择默认启动页" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="item in [
                                                { name: '首页', value: '/' },
                                                {
                                                    name: '游戏页',
                                                    value: '/games',
                                                },
                                                {
                                                    name: '管理页',
                                                    value: '/manager',
                                                },
                                                {
                                                    name: '游览页',
                                                    value: '/explore',
                                                },
                                                {
                                                    name: '下载页',
                                                    value: '/download',
                                                },
                                                {
                                                    name: 'MCP页',
                                                    value: '/mcp',
                                                },
                                                {
                                                    name: '备份页',
                                                    value: '/backup',
                                                },
                                                {
                                                    name: '关于页',
                                                    value: '/about',
                                                },
                                                {
                                                    name: '设置页',
                                                    value: '/settings',
                                                },
                                            ]"
                                            :value="item.value"
                                            >{{ item.name }}</SelectItem
                                        >
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div class="grid grid-cols-4 items-center gap-8">
                            <div class="flex gap-2 items-center">
                                <Label for="auto-add-after-download"
                                    >下载后自动添加</Label
                                >
                                <Switch
                                    id="auto-add-after-download"
                                    v-model="autoAddAfterDownload" />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="select-game-by-folder"
                                    >通过目录选择游戏</Label
                                >
                                <Switch
                                    id="select-game-by-folder"
                                    v-model="selectGameByFolder" />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="auto-start">开机自启</Label>
                                <Switch
                                    id="auto-start"
                                    v-model="autoStartModel"
                                    :disabled="autoStartLoading" />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="modifiable-during-game"
                                    >游戏运行时可修改</Label
                                >
                                <Switch
                                    id="modifiable-during-game"
                                    v-model="modifiableDuringGame" />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="show-preload-list"
                                    >显示前置列表</Label
                                >
                                <Switch
                                    id="show-preload-list"
                                    v-model="showPreloadList" />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="disable-symlink-install"
                                    >关闭软链安装</Label
                                >
                                <Switch
                                    id="disable-symlink-install"
                                    v-model="disableSymlinkInstall" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <h3>高级设置</h3>
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="flex flex-col gap-4">
                        <div class="grid grid-cols-4 items-center gap-4">
                            <div class="flex gap-2 items-center">
                                <Label for="debug-mode">调试模式</Label>
                                <Switch id="debug-mode" v-model="debugMode" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
        <Card v-if="debugMode">
            <CardHeader>
                <CardTitle>
                    <h3>调试信息</h3>
                </CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
                <pre>{{ JSON.stringify(PersistentStore.store, null, 2) }}</pre>
            </CardContent>
        </Card>
    </div>
</template>
<style scoped></style>
