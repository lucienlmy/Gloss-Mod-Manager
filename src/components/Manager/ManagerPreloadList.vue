<script setup lang="ts">
import { ElMessage } from "element-plus-message";
import { Aria2Rpc, type IAria2RpcTask } from "@/lib/aria2-rpc";
import {
    queueGlossModDownloadWithSelection,
    queueThirdPartyModDownloadWithSelection,
} from "@/lib/download-file-selection";
import {
    findGlossDuplicateTasks,
    getGlossModPresence,
    type GlossDownloadPresence,
    type IGlossDownloadTaskMeta,
} from "@/lib/gloss-download";
import { fetchGlossGamePlugins } from "@/lib/gloss-mod-api";
import { PersistentStore } from "@/lib/persistent-store";
import {
    fetchThirdPartyModDetail,
    type IThirdPartyModDetail,
    type ThirdPartyProvider,
} from "@/lib/third-party-mod-api";
import { ArrowDownToLine, RefreshCw } from "lucide-vue-next";

interface IPreloadStatus {
    state: GlossDownloadPresence;
    statusLabel: string;
    actionLabel: string;
    progress: number;
}

interface IPreloadLookupCriteria {
    sourceType?: sourceType;
    externalId?: number | string;
    modId?: number | string;
    fileName?: string;
    modTitle?: string;
}

const manager = useManager();
const settings = useSettings();
const taskMetaMap = PersistentStore.useValue<
    Record<string, IGlossDownloadTaskMeta>
>("aria2TaskMetaMap", {});

const { showPreloadList } = storeToRefs(settings);

const loading = ref(false);
const errorMessage = ref("");
const preloadCatalog = ref<IGamePlugins[]>([]);
const hasLoadedCatalog = ref(false);
const queueingPreloadId = ref("");
const resolvedPreloadCriteriaMap = ref<Record<string, IPreloadLookupCriteria>>(
    {},
);
const taskSnapshots = ref<Record<string, IAria2RpcTask>>({});

const currentGame = computed(() => manager.managerGame);
const currentGameId = computed(() => currentGame.value?.GlossGameId ?? 0);
const currentGameName = computed(() => {
    return currentGame.value?.gameShowName ?? currentGame.value?.gameName ?? "";
});
let refreshTaskSnapshotPending = false;
let taskSnapshotTimer: ReturnType<typeof globalThis.setInterval> | null = null;

const basePreloadItems = computed(() => {
    if (!showPreloadList.value || !currentGameId.value) {
        return [] as IGamePlugins[];
    }

    return dedupePreloadItems(preloadCatalog.value).filter((item) => {
        return item.game_id.includes(currentGameId.value);
    });
});
const preloadStatusMap = computed<Record<string, IPreloadStatus>>(() => {
    return Object.fromEntries(
        basePreloadItems.value.map((item) => [
            getPreloadKey(item),
            resolvePreloadStatus(item),
        ]),
    );
});
const preloadItems = computed(() => {
    return [...basePreloadItems.value].sort((left, right) => {
        const priorityDifference =
            getPreloadStatusPriority(getPreloadStatus(right).state) -
            getPreloadStatusPriority(getPreloadStatus(left).state);

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        return manager.textCollator.compare(left.name, right.name);
    });
});
const totalPreloadCount = computed(() => {
    return basePreloadItems.value.length;
});
const installedPreloadCount = computed(() => {
    return basePreloadItems.value.filter((item) => {
        return getPreloadStatus(item).state === "imported";
    }).length;
});
const visiblePreloadItems = computed(() => {
    return preloadItems.value.filter((item) => {
        return getPreloadStatus(item).state !== "imported";
    });
});
const pendingPreloadCount = computed(() => {
    return visiblePreloadItems.value.length;
});
const shouldPollTaskSnapshots = computed(() => {
    return Object.values(preloadStatusMap.value).some((status) => {
        return ["active", "waiting", "paused"].includes(status.state);
    });
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

watch(
    shouldPollTaskSnapshots,
    (shouldPoll) => {
        if (shouldPoll) {
            void refreshTaskSnapshots();

            if (taskSnapshotTimer === null) {
                taskSnapshotTimer = globalThis.setInterval(() => {
                    void refreshTaskSnapshots();
                }, 2000);
            }

            return;
        }

        if (taskSnapshotTimer !== null) {
            globalThis.clearInterval(taskSnapshotTimer);
            taskSnapshotTimer = null;
        }

        taskSnapshots.value = {};
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    if (taskSnapshotTimer !== null) {
        globalThis.clearInterval(taskSnapshotTimer);
        taskSnapshotTimer = null;
    }
});

function dedupePreloadItems(list: IGamePlugins[]) {
    const preloadMap = new Map<string, IGamePlugins>();

    for (const item of list) {
        const key = getPreloadKey(item);

        if (!preloadMap.has(key)) {
            preloadMap.set(key, item);
        }
    }

    return [...preloadMap.values()];
}

function getPreloadKey(item: IGamePlugins) {
    return `${item.from}:${item.web_id || item.id || item.name}`;
}

function getPreloadOther(item: IGamePlugins) {
    return (item.other ?? {}) as Record<string, unknown>;
}

function getPreloadExternalId(item: IGamePlugins) {
    const normalizedExternalId = String(item.web_id ?? "").trim();

    if (!normalizedExternalId || normalizedExternalId === "0") {
        return undefined;
    }

    return normalizedExternalId;
}

function getPreloadProvider(item: IGamePlugins): ThirdPartyProvider | null {
    switch (item.from) {
        case "NexusMods":
        case "Thunderstore":
        case "ModIo":
        case "CurseForge":
        case "GameBanana":
            return item.from;
        default:
            return null;
    }
}

function buildPreloadCriteria(item: IGamePlugins): IPreloadLookupCriteria {
    const externalId = getPreloadExternalId(item);

    return {
        sourceType: item.from,
        externalId,
        modId: item.from === "GlossMod" ? externalId : undefined,
        modTitle: item.name,
        fileName: item.name,
    };
}

function cacheResolvedPreloadCriteria(
    item: IGamePlugins,
    detail: IThirdPartyModDetail,
) {
    const preloadFile = detail.primaryFile ?? detail.files[0] ?? null;

    resolvedPreloadCriteriaMap.value = {
        ...resolvedPreloadCriteriaMap.value,
        [getPreloadKey(item)]: {
            sourceType: detail.source,
            externalId: detail.id,
            modTitle: detail.title,
            fileName: preloadFile?.name ?? item.name,
        },
    };
}

function getPreloadCriteria(item: IGamePlugins) {
    return (
        resolvedPreloadCriteriaMap.value[getPreloadKey(item)] ??
        buildPreloadCriteria(item)
    );
}

function getMatchedTask(item: IGamePlugins) {
    for (const match of findGlossDuplicateTasks(
        taskMetaMap.value,
        getPreloadCriteria(item),
    )) {
        const task = taskSnapshots.value[match.gid];

        if (task && task.status !== "removed") {
            return task;
        }
    }

    return null;
}

function toNumber(value?: string | number) {
    const normalized = Number(value ?? 0);

    return Number.isFinite(normalized) ? normalized : 0;
}

function getTaskProgress(task?: IAria2RpcTask | null) {
    if (!task) {
        return 0;
    }

    const totalLength = toNumber(task.totalLength);

    if (totalLength <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round((toNumber(task.completedLength) / totalLength) * 100),
    );
}

function resolvePreloadStatus(item: IGamePlugins): IPreloadStatus {
    const presence = getGlossModPresence(
        taskMetaMap.value,
        manager.managerModList,
        getPreloadCriteria(item),
    );
    const task = getMatchedTask(item);

    switch (presence.state) {
        case "active":
            return {
                state: "active",
                statusLabel: "下载中",
                actionLabel: "下载中",
                progress: getTaskProgress(task),
            };
        case "waiting":
            return {
                state: "waiting",
                statusLabel: "排队中",
                actionLabel: "排队中",
                progress: getTaskProgress(task),
            };
        case "paused":
            return {
                state: "paused",
                statusLabel: "已暂停",
                actionLabel: "继续下载",
                progress: getTaskProgress(task),
            };
        case "error":
            return {
                state: "error",
                statusLabel: "下载失败",
                actionLabel: "重新下载",
                progress: 0,
            };
        case "complete":
            return {
                state: "complete",
                statusLabel: "已下载",
                actionLabel: "重新下载",
                progress: 100,
            };
        case "imported":
            return {
                state: "imported",
                statusLabel: "已安装",
                actionLabel: "已安装",
                progress: 100,
            };
        default:
            return {
                state: "none",
                statusLabel: "待下载",
                actionLabel: "加入下载",
                progress: 0,
            };
    }
}

function getPreloadStatus(item: IGamePlugins) {
    return (
        preloadStatusMap.value[getPreloadKey(item)] ?? {
            state: "none",
            statusLabel: "待下载",
            actionLabel: "加入下载",
            progress: 0,
        }
    );
}

function getPreloadStatusPriority(status: GlossDownloadPresence) {
    const priorityMap: Record<GlossDownloadPresence, number> = {
        active: 600,
        waiting: 500,
        paused: 400,
        error: 300,
        none: 200,
        complete: 100,
        imported: 0,
    };

    return priorityMap[status];
}

function getDescriptionText(value?: string) {
    return (value ?? "").replace(/\s+/gu, " ").trim();
}

function shouldShowProgress(item: IGamePlugins) {
    return ["active", "waiting", "paused"].includes(
        getPreloadStatus(item).state,
    );
}

function isPreloadActionDisabled(item: IGamePlugins) {
    if (queueingPreloadId.value === getPreloadKey(item)) {
        return true;
    }

    return ["active", "waiting", "imported"].includes(
        getPreloadStatus(item).state,
    );
}

function getPreloadStatusBadgeClass(item: IGamePlugins) {
    const status = getPreloadStatus(item).state;

    if (status === "active") {
        return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-200";
    }

    if (status === "waiting" || status === "paused") {
        return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200";
    }

    if (status === "complete" || status === "imported") {
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
    }

    if (status === "error") {
        return "border-destructive/40 bg-destructive/10 text-destructive";
    }

    return "border-muted-foreground/20 bg-muted/40 text-muted-foreground";
}

function getPreloadButtonClass(item: IGamePlugins) {
    const status = getPreloadStatus(item).state;

    if (status === "active") {
        return "border-sky-500/40 bg-sky-500/10 text-sky-700 hover:bg-sky-500/15 dark:text-sky-200";
    }

    if (status === "waiting" || status === "paused") {
        return "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-200";
    }

    if (status === "complete" || status === "imported") {
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-200";
    }

    if (status === "error") {
        return "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15";
    }

    return "";
}

function getProgressBarClass(item: IGamePlugins) {
    const status = getPreloadStatus(item).state;

    if (status === "active") {
        return "bg-sky-500";
    }

    if (status === "paused") {
        return "bg-amber-500";
    }

    return "bg-amber-400";
}

async function refreshTaskSnapshots() {
    if (!shouldPollTaskSnapshots.value || refreshTaskSnapshotPending) {
        return;
    }

    refreshTaskSnapshotPending = true;

    try {
        const [activeTasks, waitingTasks, stoppedTasks] = await Promise.all([
            Aria2Rpc.tellActive(),
            Aria2Rpc.tellWaiting(0, 100),
            Aria2Rpc.tellStopped(0, 100),
        ]);

        taskSnapshots.value = Object.fromEntries(
            [...activeTasks, ...waitingTasks, ...stoppedTasks].map((task) => [
                task.gid,
                task,
            ]),
        );
    } catch (error) {
        console.error("刷新前置下载状态失败");
        console.error(error);
    } finally {
        refreshTaskSnapshotPending = false;
    }
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
        resolvedPreloadCriteriaMap.value = {};
        hasLoadedCatalog.value = true;
    } catch (error: unknown) {
        preloadCatalog.value = [];
        resolvedPreloadCriteriaMap.value = {};
        hasLoadedCatalog.value = false;
        errorMessage.value =
            error instanceof Error ? error.message : "读取前置列表失败";
    } finally {
        loading.value = false;
    }
}

async function resolveThirdPartyPreloadDetail(item: IGamePlugins) {
    const game = currentGame.value;

    if (!game) {
        throw new Error("当前没有已选中的游戏。");
    }

    const provider = getPreloadProvider(item);

    if (!provider) {
        throw new Error("当前前置来源暂不支持直接下载。");
    }

    const preloadOther = getPreloadOther(item);

    switch (provider) {
        case "Thunderstore": {
            const namespace = String(preloadOther.namespace ?? "").trim();
            const name = String(preloadOther.name ?? "").trim();

            if (!namespace || !name) {
                throw new Error("当前 Thunderstore 前置缺少包标识，无法下载。");
            }

            const detail = await fetchThirdPartyModDetail(
                provider,
                game,
                String(item.web_id || item.id || name),
                {
                    source: provider,
                    namespace,
                    name,
                },
                settings.nexusModsUser,
            );

            cacheResolvedPreloadCriteria(item, detail);

            return {
                detail,
                provider,
            };
        }
        case "NexusMods":
        case "ModIo":
        case "CurseForge":
        case "GameBanana": {
            const routeId = String(
                preloadOther.modId ?? item.web_id ?? "",
            ).trim();

            if (!routeId || routeId === "0") {
                throw new Error(
                    `当前 ${provider} 前置缺少资源标识，无法下载。`,
                );
            }

            const routeQuery: Record<string, string> = {
                source: provider,
            };

            if (provider === "ModIo") {
                const gameId = String(
                    preloadOther.gameId ?? game.mod_io ?? "",
                ).trim();

                if (gameId) {
                    routeQuery.gameId = gameId;
                }
            }

            const detail = await fetchThirdPartyModDetail(
                provider,
                game,
                routeId,
                routeQuery,
                settings.nexusModsUser,
            );

            cacheResolvedPreloadCriteria(item, detail);

            return {
                detail,
                provider,
            };
        }
    }
}

async function queuePreload(item: IGamePlugins) {
    const preloadId = getPreloadKey(item);
    queueingPreloadId.value = preloadId;

    try {
        const result =
            item.from === "GlossMod"
                ? await queueGlossModDownloadWithSelection({
                      modId: item.web_id,
                      managerModList: manager.managerModList,
                  })
                : await (async () => {
                      const { detail, provider } =
                          await resolveThirdPartyPreloadDetail(item);

                      return queueThirdPartyModDownloadWithSelection({
                          provider,
                          mod: detail,
                          gameName: currentGameName.value,
                          managerModList: manager.managerModList,
                          nexusUser: settings.nexusModsUser,
                      });
                  })();

        if (!result) {
            ElMessage.info("已取消选择下载文件。");
            return;
        }

        if (
            ["created", "resumed", "retried", "exists"].includes(result.status)
        ) {
            void refreshTaskSnapshots();
        }

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
                        所需前置 {{ totalPreloadCount }} 个
                    </Badge>
                    <Badge variant="outline" class="rounded-full">
                        已安装 {{ installedPreloadCount }} /
                        {{ totalPreloadCount }}
                    </Badge>
                    <Badge
                        v-if="pendingPreloadCount > 0"
                        variant="outline"
                        class="rounded-full"
                    >
                        待处理 {{ pendingPreloadCount }} 个
                    </Badge>
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
                    :key="getPreloadKey(item)"
                    class="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div class="min-w-0 flex-1 space-y-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="font-medium text-foreground">
                                {{ item.name }}
                            </span>
                            <Badge variant="outline" class="rounded-full">
                                Gloss Mod
                            </Badge>
                            <Badge
                                variant="outline"
                                class="rounded-full"
                                :class="getPreloadStatusBadgeClass(item)"
                            >
                                {{ getPreloadStatus(item).statusLabel }}
                            </Badge>
                        </div>
                        <p
                            class="line-clamp-2 text-sm text-muted-foreground"
                            :title="getDescriptionText(item.desc)"
                        >
                            {{ getDescriptionText(item.desc) || "暂无说明" }}
                        </p>
                        <div v-if="shouldShowProgress(item)" class="space-y-1">
                            <div
                                class="h-1.5 overflow-hidden rounded-full bg-muted"
                            >
                                <div
                                    class="h-full rounded-full transition-[width] duration-300"
                                    :class="getProgressBarClass(item)"
                                    :style="{
                                        width: `${getPreloadStatus(item).progress}%`,
                                    }"
                                ></div>
                            </div>
                            <div
                                class="flex items-center justify-between text-[11px] text-muted-foreground"
                            >
                                <span>{{
                                    getPreloadStatus(item).statusLabel
                                }}</span>
                                <span
                                    >{{
                                        getPreloadStatus(item).progress
                                    }}%</span
                                >
                            </div>
                        </div>
                    </div>

                    <div
                        class="flex shrink-0 flex-col items-stretch gap-2 sm:items-end"
                    >
                        <Button
                            variant="outline"
                            :class="getPreloadButtonClass(item)"
                            :disabled="isPreloadActionDisabled(item)"
                            @click="queuePreload(item)"
                        >
                            <ArrowDownToLine class="h-4 w-4" />
                            {{
                                queueingPreloadId === getPreloadKey(item)
                                    ? "加入中..."
                                    : getPreloadStatus(item).actionLabel
                            }}
                        </Button>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<style scoped></style>
