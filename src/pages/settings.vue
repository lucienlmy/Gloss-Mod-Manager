<script setup lang="ts">
import { Theme, type ThemeMode } from "@/lib/theme";
import { useManager } from "@/stores/manager";

const { theme, setTheme } = Theme.use();
const managerStore = useManager();

const themeModel = computed<ThemeMode>({
    get: () => theme.value,
    set: (value) => setTheme(value),
});

const modStorageModel = computed({
    get: () => managerStore.modStorageLocation,
    set: (value: string | number) =>
        managerStore.setModStorageLocation(String(value)),
});

const linkModeModel = computed({
    get: () => (managerStore.closeSoftLinks ? "copy" : "link"),
    set: (value: string) => managerStore.setCloseSoftLinks(value === "copy"),
});
</script>
<template>
    <div class="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <CardTitle>
                    <h1>设置</h1>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <h3>基础配置</h3>
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="flex">
                        <div class="flex gap-2 items-center">
                            <div class="text-sm font-medium">主题</div>
                            <Select v-model="themeModel">
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
                                    <SelectItem value="dark">深色</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>管理器上下文</CardTitle>
                <CardDescription>
                    这些值会直接驱动 Tauri 版
                    Manager.configureContext。空的模组缓存目录会自动回退到应用本地目录。
                </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-5">
                <div class="grid gap-2">
                    <div class="text-sm font-medium">模组缓存目录</div>
                    <Textarea
                        v-model="modStorageModel"
                        placeholder="留空时默认写入 appLocalDataDir/mods" />
                    <div class="text-xs text-muted-foreground break-all">
                        当前生效值：{{ managerStore.effectiveModStorageLabel }}
                    </div>
                </div>

                <div class="grid gap-2">
                    <div class="text-sm font-medium">文件处理策略</div>
                    <Select v-model="linkModeModel">
                        <SelectTrigger>
                            <SelectValue placeholder="选择策略" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="copy"
                                >复制模式（关闭软链接）</SelectItem
                            >
                            <SelectItem value="link">链接优先模式</SelectItem>
                        </SelectContent>
                    </Select>
                    <div class="text-xs text-muted-foreground">
                        当前生效值：{{ managerStore.installModeLabel }}
                    </div>
                </div>

                <div
                    class="rounded-lg border border-border/60 p-4 text-sm text-muted-foreground">
                    当前游戏：{{
                        managerStore.managerGame?.gameShowName ||
                        managerStore.managerGame?.gameName ||
                        "未选择"
                    }}
                    <br />
                    当前游戏目录：{{
                        managerStore.managerGameStorage || "未设置"
                    }}
                </div>
            </CardContent>
        </Card>
    </div>
</template>
<style scoped></style>
