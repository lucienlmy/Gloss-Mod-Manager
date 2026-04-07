<script setup lang="ts">
import type { ThemeMode } from "../lib/theme";
import { useTheme } from "../lib/theme";

const { theme, setTheme } = useTheme();

const themeModel = computed<ThemeMode>({
    get: () => theme.value,
    set: (value) => setTheme(value),
});
</script>
<template>
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
                                <SelectItem value="system">跟随系统</SelectItem>
                                <SelectItem value="light"> 浅色 </SelectItem>
                                <SelectItem value="dark">深色</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </CardContent>
    </Card>
</template>
<style scoped></style>
