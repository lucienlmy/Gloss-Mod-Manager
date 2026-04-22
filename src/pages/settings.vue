<script setup lang="ts">
import { openUrl } from "@tauri-apps/plugin-opener";
import { ElMessage } from "element-plus-message";
import { type ThemeMode } from "@/lib/theme";
import { useSettings } from "@/stores/settings";

const settings = useSettings();
const route = useRoute();
const router = useRouter();
const {
    autoAddAfterDownload,
    autoStart,
    autoStartLoading,
    debugInfo,
    debugMode,
    defaultStartPage,
    closeSoftLinks,
    modifiableDuringGame,
    nexusModsAuthorized,
    nexusModsLoginLoading,
    nexusModsUser,
    selectGameByFolder,
    showPreloadList,
    storagePath,
    theme,
} = storeToRefs(settings);

const themeModel = computed<ThemeMode>({
    get: () => theme.value,
    set: (value) => settings.setTheme(value),
});

const autoStartModel = computed({
    get: () => autoStart.value,
    set: async (value: boolean) => {
        try {
            await settings.setAutoStart(value);
        } catch (error: unknown) {
            console.error("设置开机自启失败");
            console.error(error);
            ElMessage.error("设置开机自启失败");
        }
    },
});

async function handleNexusModsLogin() {
    try {
        const user = await settings.loginNexusModsUser();
        ElMessage.success(`${user.name} 授权成功`);
    } catch (error: unknown) {
        console.error("NexusMods 授权失败");
        console.error(error);
        ElMessage.error(
            error instanceof Error ? error.message : "NexusMods 授权失败",
        );
    }
}

function handleNexusModsLogout() {
    settings.clearNexusModsAuthorization();
    ElMessage.success("已清除 NexusMods 授权");
}

async function openNexusModsProfile() {
    const profileUrl = `https://www.nexusmods.com/profile/${nexusModsUser.value?.name?.trim()}`;

    if (!profileUrl) {
        return;
    }

    try {
        await openUrl(profileUrl);
    } catch (error: unknown) {
        console.error("打开 NexusMods 主页失败");
        console.error(error);
        ElMessage.error("打开 NexusMods 主页失败");
    }
}

watch(
    () => route.query.nexusAuthAction,
    (action) => {
        if (
            action !== "login" ||
            nexusModsAuthorized.value ||
            nexusModsLoginLoading.value
        ) {
            return;
        }

        const nextQuery = { ...route.query };
        delete nextQuery.nexusAuthAction;

        // 通过路由参数触发与按钮一致的登录流程，避免重复执行。
        void router.replace({
            path: route.path,
            query: nextQuery,
        });
        void handleNexusModsLogin();
    },
    { immediate: true },
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
                            <!-- 这个站两格 -->
                            <div class="col-span-2 items-center">
                                <InputGroup>
                                    <InputGroupInput
                                        id="storage-path"
                                        v-model="storagePath"
                                        disabled
                                    ></InputGroupInput>
                                    <InputGroupAddon>
                                        <Label
                                            for="storage-path"
                                            class="text-sm font-medium"
                                            >储存路径</Label
                                        >
                                    </InputGroupAddon>
                                    <InputGroupAddon align="inline-end">
                                        <Button
                                            variant="secondary"
                                            @click="settings.selectStoragePath"
                                        >
                                            选择
                                        </Button>
                                    </InputGroupAddon>
                                </InputGroup>
                            </div>
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
                                    v-model="defaultStartPage"
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder="选择默认启动页"
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="item in settings.settingsStartPageOptions"
                                            :key="item.value"
                                            :value="item.value"
                                        >
                                            {{ item.name }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div class="grid grid-cols-4 items-center gap-8">
                            <div class="flex gap-2 items-center">
                                <Label for="auto-add-after-download"
                                    >下载后自动导入</Label
                                >
                                <Switch
                                    id="auto-add-after-download"
                                    v-model="autoAddAfterDownload"
                                />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="select-game-by-folder"
                                    >通过目录选择游戏</Label
                                >
                                <Switch
                                    id="select-game-by-folder"
                                    v-model="selectGameByFolder"
                                />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="auto-start">开机自启</Label>
                                <Switch
                                    id="auto-start"
                                    v-model="autoStartModel"
                                    :disabled="autoStartLoading"
                                />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="modifiable-during-game"
                                    >游戏运行时可修改</Label
                                >
                                <Switch
                                    id="modifiable-during-game"
                                    v-model="modifiableDuringGame"
                                />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="show-preload-list"
                                    >显示前置列表</Label
                                >
                                <Switch
                                    id="show-preload-list"
                                    v-model="showPreloadList"
                                />
                            </div>
                            <div class="flex gap-2 items-center">
                                <Label for="disable-symlink-install"
                                    >关闭软链安装</Label
                                >
                                <Switch
                                    id="disable-symlink-install"
                                    v-model="closeSoftLinks"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <h3>授权</h3>
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="flex flex-col gap-4">
                        <div
                            class="rounded-xl border border-border/70 bg-muted/40 p-4"
                        >
                            <div
                                class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
                            >
                                <div class="space-y-1">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-medium">
                                            NexusMods
                                        </span>
                                        <Badge
                                            class="rounded-full"
                                            :variant="
                                                nexusModsAuthorized
                                                    ? 'secondary'
                                                    : 'outline'
                                            "
                                        >
                                            {{
                                                nexusModsAuthorized
                                                    ? "已授权"
                                                    : "未授权"
                                            }}
                                        </Badge>
                                    </div>
                                    <p
                                        v-if="
                                            nexusModsAuthorized && nexusModsUser
                                        "
                                        class="text-sm text-muted-foreground"
                                    >
                                        当前账号：{{ nexusModsUser.name }}（ID:
                                        {{ nexusModsUser.user_id }}）
                                    </p>
                                    <p
                                        v-else
                                        class="text-sm text-muted-foreground"
                                    >
                                        使用 NexusMods 浏览与下载前，需要先完成
                                        SSO 授权。
                                    </p>
                                </div>

                                <div class="flex flex-wrap gap-2">
                                    <Button
                                        variant="secondary"
                                        :disabled="nexusModsLoginLoading"
                                        @click="handleNexusModsLogin"
                                    >
                                        {{
                                            nexusModsAuthorized
                                                ? "重新授权"
                                                : "登录 NexusMods"
                                        }}
                                    </Button>
                                    <Button
                                        v-if="
                                            nexusModsAuthorized &&
                                            nexusModsUser?.profile_url
                                        "
                                        variant="outline"
                                        @click="openNexusModsProfile"
                                    >
                                        打开主页
                                    </Button>
                                    <Button
                                        v-if="nexusModsAuthorized"
                                        variant="outline"
                                        @click="handleNexusModsLogout"
                                    >
                                        清除授权
                                    </Button>
                                </div>
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
                <pre class="max-h-75 overflow-auto p-4 rounded text-sm">{{
                    JSON.stringify(debugInfo, null, 2)
                }}</pre>
            </CardContent>
        </Card>
    </div>
</template>
<style scoped></style>
