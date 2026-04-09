<script setup lang="ts">
const manager = useManager();
</script>
<template>
    <div class="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <Card
            v-for="mod in manager.filteredMods"
            :key="mod.id"
            class="transition-colors border-border">
            <CardHeader class="gap-4">
                <div class="flex items-start justify-between gap-4">
                    <div class="space-y-2">
                        <CardTitle class="text-lg leading-tight">
                            {{ mod.modName }}
                        </CardTitle>
                        <CardDescription>
                            {{ mod.fileName }}
                        </CardDescription>
                    </div>
                    <div class="flex items-center gap-2">
                        <span
                            class="rounded-full px-2.5 py-1 text-xs font-medium"
                            :class="
                                mod.isInstalled
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-muted text-muted-foreground'
                            ">
                            {{ mod.isInstalled ? "已安装" : "未安装" }}
                        </span>
                        <span
                            class="rounded-full bg-accent px-2.5 py-1 text-xs font-medium">
                            {{ manager.getTypeName(mod.modType) }}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                        <div class="text-muted-foreground">版本</div>
                        <div class="mt-1 font-medium">
                            {{ mod.modVersion }}
                        </div>
                    </div>
                    <div>
                        <div class="text-muted-foreground">作者</div>
                        <div class="mt-1 font-medium">
                            {{ mod.modAuthor || "未填写" }}
                        </div>
                    </div>
                    <div>
                        <div class="text-muted-foreground">文件数</div>
                        <div class="mt-1 font-medium">
                            {{ mod.modFiles.length }}
                        </div>
                    </div>
                    <div>
                        <div class="text-muted-foreground">优先级</div>
                        <div class="mt-1 font-medium">
                            {{ mod.weight }}
                        </div>
                    </div>
                </div>

                <div v-if="mod.tags?.length" class="flex flex-wrap gap-2">
                    <span
                        v-for="tag in mod.tags"
                        :key="tag.name"
                        class="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                        :style="{ backgroundColor: tag.color }">
                        <span
                            class="h-1.5 w-1.5 rounded-full bg-white/80"></span>
                        {{ tag.name }}
                    </span>
                </div>
                <p v-else class="text-sm text-muted-foreground">暂无标签</p>
            </CardContent>
        </Card>
    </div>
</template>
<style scoped></style>
