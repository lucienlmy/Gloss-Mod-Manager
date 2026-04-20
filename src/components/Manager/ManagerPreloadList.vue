<script setup lang="ts">
import { ElMessage } from "element-plus-message";
import { ArrowDownToLine, RefreshCw } from "lucide-vue-next";
import { queueGlossModDownload } from "@/lib/gloss-download-queue";
import { fetchGlossGamePlugins } from "@/lib/gloss-mod-api";

const manager = useManager();
const settings = useSettings();

const { showPreloadList } = storeToRefs(settings);

const loading = ref(false);
const errorMessage = ref("");
const preloadCatalog = ref<IGamePlugins[]>([]);
const hasLoadedCatalog = ref(false);
const queueingPreloadId = ref("");

const currentGameId = computed(() => manager.managerGame?.GlossGameId ?? 0);

const visiblePreloadItems = computed(() => {
    if (!showPreloadList.value || !currentGameId.value) {
        return [] as IGamePlugins[];
    }

    return dedupePreloadItems(preloadCatalog.value)
        .filter((item) => item.game_id.includes(currentGameId.value))
        .filter((item) => !isPreloadAdded(item))
        .sort((left, right) =>
            manager.textCollator.compare(left.name, right.name),
        );
});

const shouldShowCard = computed(() => {
    if (!showPreloadList.value || !currentGameId.value) {
        return false;
    }

    return (
        loading.value ||
        Boolean(errorMessage.value) ||
        visiblePreloadItems.value.length > 0
    );
});

watch(
    [currentGameId, showPreloadList],
    async ([gameId, enabled]) => {
        if (!enabled || !gameId) {
            errorMessage.value = "";
            return;
        }

        if (hasLoadedCatalog.value) {
            return;
        }

        await loadPreloadCatalog();
    },
    { immediate: true },
);

function normalizeCompareText(value?: string) {
    return (value ?? "").trim().toLowerCase();
}

function dedupePreloadItems(list: IGamePlugins[]) {
    const preloadMap = new Map<string, IGamePlugins>();

    for (const item of list) {
        const key = String(item.web_id || item.id || item.name);

        if (!preloadMap.has(key)) {
            preloadMap.set(key, item);
        }
    }

    return [...preloadMap.values()];
}

function isPreloadAdded(item: IGamePlugins) {
    const normalizedName = normalizeCompareText(item.name);

    return manager.managerModList.some((mod) => {
        return (
            String(mod.webId ?? "") === String(item.web_id) ||
            normalizeCompareText(mod.modName) === normalizedName ||
            normalizeCompareText(mod.fileName) === normalizedName
        );
    });
}

function getDescriptionText(value?: string) {
    return (value ?? "").replace(/\s+/gu, " ").trim();
}

async function loadPreloadCatalog(force = false) {
    if (loading.value) {
        return;
    }

    if (hasLoadedCatalog.value && !force) {
        return;
    }

    loading.value = true;
    errorMessage.value = "";

    try {
        // 前置接口返回的是全量列表，当前页只在首次进入时拉取一次。
        preloadCatalog.value = await fetchGlossGamePlugins();
        hasLoadedCatalog.value = true;
    } catch (error: unknown) {
        preloadCatalog.value = [];
        hasLoadedCatalog.value = false;
        errorMessage.value =
            error instanceof Error ? error.message : "读取前置列表失败";
    } finally {
        loading.value = false;
    }
}

async function queuePreload(item: IGamePlugins) {
    const preloadId = String(item.web_id || item.id || item.name);
    queueingPreloadId.value = preloadId;

    try {
        const result = await queueGlossModDownload({
            modId: item.web_id,
            resourceId: "latest",
            managerModList: manager.managerModList,
        });

        if (
            result.status === "created" ||
            result.status === "resumed" ||
            result.status === "retried"
        ) {
            ElMessage.success(result.message);
            return;
        }

        ElMessage.info(result.message);
    } catch (error: unknown) {
        console.error("提交前置下载任务失败");
        console.error(error);
        ElMessage.error(
            error instanceof Error
                ? error.message
                : "提交前置下载任务失败，请稍后重试。",
        );
    } finally {
        if (queueingPreloadId.value === preloadId) {
            queueingPreloadId.value = "";
        }
    }
}
</script>

<template>
    <Card v-if="shouldShowCard">
        <CardHeader class="gap-3">
            <CardTitle
                class="flex flex-wrap items-center justify-between gap-3"
            >
                <div class="flex flex-wrap items-center gap-2">
                    <Badge
                        variant="secondary"
                        class="rounded-full bg-amber-100 text-amber-900 hover:bg-amber-100"
                    >
                        所需前置 {{ visiblePreloadItems.length }} 个
                    </Badge>
                    <span class="text-base font-semibold"> </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    :disabled="loading"
                    @click="loadPreloadCatalog(true)"
                >
                    <RefreshCw
                        class="h-4 w-4"
                        :class="loading ? 'animate-spin' : ''"
                    />
                    刷新前置
                </Button>
            </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
            <div v-if="loading" class="space-y-3">
                <div
                    v-for="index in 2"
                    :key="index"
                    class="h-24 animate-pulse rounded-xl border bg-muted/40"
                ></div>
            </div>

            <div
                v-else-if="errorMessage"
                class="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
                <p class="text-destructive">{{ errorMessage }}</p>
                <Button
                    variant="outline"
                    size="sm"
                    @click="loadPreloadCatalog(true)"
                >
                    重试
                </Button>
            </div>

            <div
                v-else
                class="overflow-hidden rounded-xl border bg-background/85"
            >
                <div
                    v-for="item in visiblePreloadItems"
                    :key="item.web_id"
                    class="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div class="min-w-0 space-y-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="font-medium text-foreground">
                                {{ item.name }}
                            </span>
                            <Badge variant="outline" class="rounded-full">
                                Gloss Mod
                            </Badge>
                        </div>
                        <p
                            class="line-clamp-2 text-sm text-muted-foreground"
                            :title="getDescriptionText(item.desc)"
                        >
                            {{ getDescriptionText(item.desc) || "暂无说明" }}
                        </p>
                    </div>

                    <div class="flex shrink-0 items-center gap-2">
                        <Button
                            :disabled="
                                queueingPreloadId ===
                                String(item.web_id || item.id || item.name)
                            "
                            @click="queuePreload(item)"
                        >
                            <ArrowDownToLine class="h-4 w-4" />
                            {{
                                queueingPreloadId ===
                                String(item.web_id || item.id || item.name)
                                    ? "加入中..."
                                    : "加入下载"
                            }}
                        </Button>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<style scoped></style>
