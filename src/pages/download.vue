<script setup lang="ts">
import { documentDir, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { fetch as httpFetch } from "@tauri-apps/plugin-http";
import { ElMessage } from "element-plus-message";
import {
    Aria2Rpc,
    type IAria2GlobalStat,
    type IAria2RpcTask,
} from "@/lib/aria2-rpc";

type QueueFilter = "all" | "active" | "waiting" | "paused" | "stopped";

interface IGlossApiResponse<T> {
    success: boolean;
    msg: string;
    data: T | null;
}

interface IAria2TaskMeta {
    modId?: number;
    modTitle?: string;
    gameName?: string;
    resourceName?: string;
    fileName?: string;
    author?: string;
    version?: string;
    cover?: string;
    content?: string;
    sourceUrl?: string;
}

const GLOSS_MOD_API_BASE_URL = "https://mod.3dmgame.com/api/v3";
const GLOSS_MOD_WEB_BASE_URL = "https://mod.3dmgame.com";
const GLOSS_MOD_KEY = (import.meta.env.GLOSS_MOD_KEY ?? "").trim();
const EMPTY_POSTER =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
		<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
			<defs>
				<linearGradient id="download-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="#121212" />
					<stop offset="55%" stop-color="#4a2d15" />
					<stop offset="100%" stop-color="#dfa85d" />
				</linearGradient>
			</defs>
			<rect width="640" height="360" rx="24" fill="url(#download-gradient)" />
			<circle cx="120" cy="84" r="72" fill="rgba(255,255,255,0.08)" />
			<circle cx="540" cy="280" r="96" fill="rgba(255,255,255,0.08)" />
			<text x="42" y="206" fill="#fff5df" font-size="40" font-family="Arial, sans-serif">Gloss Download</text>
			<text x="42" y="246" fill="#ffe0a3" font-size="22" font-family="Arial, sans-serif">内置详情与 aria2 下载</text>
		</svg>
	`);
const defaultGlobalStat = (): IAria2GlobalStat => ({
    downloadSpeed: "0",
    uploadSpeed: "0",
    numActive: "0",
    numWaiting: "0",
    numStopped: "0",
});
const queueFilterLabels: Record<QueueFilter, string> = {
    all: "全部",
    active: "下载中",
    waiting: "排队中",
    paused: "已暂停",
    stopped: "已结束",
};
const taskStatusLabels: Record<string, string> = {
    active: "下载中",
    waiting: "排队中",
    paused: "已暂停",
    complete: "已完成",
    error: "失败",
    removed: "已移除",
};
const numberFormatter = new Intl.NumberFormat("zh-CN");
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

const manager = useManager();
const route = useRoute();

const storagePath = PersistentStore.useValue<string>("storagePath", "");
const downloadDirectory = PersistentStore.useValue<string>(
    "downloadDirectory",
    "",
);
const downloadProxy = PersistentStore.useValue<string>("downloadProxy", "");
const taskMetaMap = PersistentStore.useValue<Record<string, IAria2TaskMeta>>(
    "aria2TaskMetaMap",
    {},
);

const rpcState = ref<"idle" | "starting" | "ready" | "error">("idle");
const rpcErrorMessage = ref("");
const refreshingTasks = ref(false);
const globalStat = ref<IAria2GlobalStat>(defaultGlobalStat());
const activeTasks = ref<IAria2RpcTask[]>([]);
const waitingTasks = ref<IAria2RpcTask[]>([]);
const stoppedTasks = ref<IAria2RpcTask[]>([]);
const taskOperatingIds = ref<string[]>([]);

const modLookupInput = ref("");
const modLookupLoading = ref(false);
const modLookupError = ref("");
const selectedMod = ref<IMod | null>(null);
const addingResourceKey = ref("");

const queueFilter = ref<QueueFilter>("all");
const selectedTaskGid = ref("");
const defaultDownloadDirectory = ref("");

let refreshSequence = 0;
let detailSequence = 0;

const currentGameLabel = computed(
    () => manager.managerGame?.gameShowName || manager.managerGame?.gameName || "未选择",
);
const resolvedDownloadDirectory = computed(
    () => downloadDirectory.value || defaultDownloadDirectory.value,
);
const waitingQueueTasks = computed(() =>
    waitingTasks.value.filter((task) => task.status === "waiting"),
);
const pausedTasks = computed(() =>
    waitingTasks.value.filter((task) => task.status === "paused"),
);
const allTasks = computed(() => [
    ...activeTasks.value,
    ...waitingTasks.value,
    ...stoppedTasks.value,
]);
const filteredTasks = computed(() => {
    switch (queueFilter.value) {
        case "active":
            return activeTasks.value;
        case "waiting":
            return waitingQueueTasks.value;
        case "paused":
            return pausedTasks.value;
        case "stopped":
            return stoppedTasks.value;
        default:
            return allTasks.value;
    }
});
const selectedTask = computed(
    () =>
        allTasks.value.find((task) => task.gid === selectedTaskGid.value) ??
        null,
);
const selectedTaskMeta = computed(
    () => taskMetaMap.value[selectedTaskGid.value] ?? null,
);
const taskSummaryCards = computed(() => [
    {
        label: "aria2 状态",
        value:
            rpcState.value === "ready"
                ? "已连接"
                : rpcState.value === "starting"
                    ? "启动中"
                    : rpcState.value === "error"
                        ? "异常"
                        : "待启动",
    },
    {
        label: "下载中",
        value: String(activeTasks.value.length),
    },
    {
        label: "已暂停",
        value: String(pausedTasks.value.length),
    },
    {
        label: "总速度",
        value: formatSpeed(globalStat.value.downloadSpeed),
    },
]);
const queueFilterOptions = computed(() => [
    {
        value: "all" as QueueFilter,
        label: queueFilterLabels.all,
        count: allTasks.value.length,
    },
    {
        value: "active" as QueueFilter,
        label: queueFilterLabels.active,
        count: activeTasks.value.length,
    },
    {
        value: "waiting" as QueueFilter,
        label: queueFilterLabels.waiting,
        count: waitingQueueTasks.value.length,
    },
    {
        value: "paused" as QueueFilter,
        label: queueFilterLabels.paused,
        count: pausedTasks.value.length,
    },
    {
        value: "stopped" as QueueFilter,
        label: queueFilterLabels.stopped,
        count: stoppedTasks.value.length,
    },
]);
const detailParagraphs = computed(() =>
    formatDetailText(selectedMod.value?.mods_content || selectedMod.value?.mods_desc),
);

const { pause: stopTaskPolling, resume: startTaskPolling } = useIntervalFn(
    () => {
        void refreshTaskLists(true);
    },
    2000,
    { immediate: false },
);

watch(
    allTasks,
    (tasks) => {
        if (tasks.length === 0) {
            selectedTaskGid.value = "";
            return;
        }

        if (!selectedTaskGid.value) {
            selectedTaskGid.value = tasks[0].gid;
            return;
        }

        if (!tasks.some((task) => task.gid === selectedTaskGid.value)) {
            selectedTaskGid.value = tasks[0].gid;
        }
    },
    { immediate: true },
);

watch(
    [storagePath, () => manager.managerGame?.gameName],
    () => {
        void refreshDefaultDownloadDirectory();
    },
    { immediate: true },
);

watch(
    () => route.query.modId,
    (value) => {
        if (typeof value !== "string") {
            return;
        }

        const modId = extractModId(value);

        if (!modId || modId === String(selectedMod.value?.id ?? "")) {
            return;
        }

        modLookupInput.value = modId;
        void loadModDetail(modId);
    },
    { immediate: true },
);

onMounted(() => {
    void initializeDownloadPage();
});

onUnmounted(() => {
    stopTaskPolling();
});

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return "操作失败，请稍后重试。";
}

function normalizePathSegment(value: string) {
    return value.replace(/[<>:"/\\|?*\u0000-\u001F]/gu, "-").trim();
}

function extractModId(input: string) {
    const trimmed = input.trim();

    if (!trimmed) {
        return "";
    }

    if (/^\d+$/u.test(trimmed)) {
        return trimmed;
    }

    const match = trimmed.match(/mod\/(\d+)|(?:^|\D)(\d{3,})(?:\D|$)/u);

    return match?.[1] ?? match?.[2] ?? "";
}

async function refreshDefaultDownloadDirectory() {
    const baseDirectory =
        storagePath.value ||
        (await join(await documentDir(), "Gloss Mod Manager"));

    defaultDownloadDirectory.value = await join(
        baseDirectory,
        "downloads",
        "mods",
    );
}

async function ensureDownloadDirectoryReady() {
    if (!resolvedDownloadDirectory.value) {
        await refreshDefaultDownloadDirectory();
    }

    if (!resolvedDownloadDirectory.value) {
        throw new Error("未能解析下载目录，请先选择一个目录。");
    }

    await FileHandler.createDirectory(resolvedDownloadDirectory.value);

    return resolvedDownloadDirectory.value;
}

async function initializeDownloadPage() {
    try {
        rpcState.value = "starting";
        rpcErrorMessage.value = "";
        await ensureDownloadDirectoryReady();
        await Aria2Rpc.ensureServer({
            outputDirectory: resolvedDownloadDirectory.value,
        });
        rpcState.value = "ready";
        await refreshTaskLists();
        startTaskPolling();
    } catch (error: unknown) {
        rpcState.value = "error";
        rpcErrorMessage.value = getErrorMessage(error);
    }
    const initialModId =
        typeof route.query.modId === "string"
            ? extractModId(route.query.modId)
            : "";

    if (initialModId) {
        modLookupInput.value = initialModId;
        void loadModDetail(initialModId);
    }
}

async function refreshTaskLists(silent: boolean = false) {
    const currentSequence = ++refreshSequence;

    if (!silent) {
        refreshingTasks.value = true;
    }

    try {
        await ensureDownloadDirectoryReady();
        await Aria2Rpc.ensureServer({
            outputDirectory: resolvedDownloadDirectory.value,
        });

        const [stat, active, waiting, stopped] = await Promise.all([
            Aria2Rpc.getGlobalStat(),
            Aria2Rpc.tellActive(),
            Aria2Rpc.tellWaiting(0, 100),
            Aria2Rpc.tellStopped(0, 100),
        ]);

        if (currentSequence !== refreshSequence) {
            return;
        }

        globalStat.value = stat;
        activeTasks.value = active;
        waitingTasks.value = waiting;
        stoppedTasks.value = stopped;
        rpcState.value = "ready";
        rpcErrorMessage.value = "";
    } catch (error: unknown) {
        if (currentSequence !== refreshSequence) {
            return;
        }

        rpcState.value = "error";
        rpcErrorMessage.value = getErrorMessage(error);
    } finally {
        if (!silent && currentSequence === refreshSequence) {
            refreshingTasks.value = false;
        }
    }
}

async function selectDownloadDirectory() {
    const selected = await open({
        directory: true,
        defaultPath: resolvedDownloadDirectory.value,
        title: "选择下载目录",
    });

    if (!selected) {
        return;
    }

    downloadDirectory.value = selected;
    await ensureDownloadDirectoryReady();
    await refreshTaskLists();
}

async function openDownloadDirectory() {
    const directory = await ensureDownloadDirectoryReady();
    await FileHandler.openFolder(directory);
}

async function loadModDetail(explicitModId?: string) {
    const modId = explicitModId ?? extractModId(modLookupInput.value);

    if (!modId) {
        modLookupError.value = "请输入有效的 3DM Mod ID 或详情链接。";
        selectedMod.value = null;
        return;
    }

    if (!GLOSS_MOD_KEY) {
        modLookupError.value = "未读取到 GLOSS_MOD_KEY，请检查 .env 配置。";
        selectedMod.value = null;
        return;
    }

    const currentSequence = ++detailSequence;
    modLookupLoading.value = true;
    modLookupError.value = "";

    try {
        const response = await httpFetch(`${GLOSS_MOD_API_BASE_URL}/mods/${modId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: GLOSS_MOD_KEY,
            },
        });
        const payload = (await response.json()) as IGlossApiResponse<IMod>;

        if (currentSequence !== detailSequence) {
            return;
        }

        if (!response.ok || !payload.success || !payload.data) {
            throw new Error(payload.msg || "读取 Mod 详情失败");
        }

        selectedMod.value = payload.data;
        modLookupInput.value = String(payload.data.id);
    } catch (error: unknown) {
        if (currentSequence !== detailSequence) {
            return;
        }

        selectedMod.value = null;
        modLookupError.value = getErrorMessage(error);
    } finally {
        if (currentSequence === detailSequence) {
            modLookupLoading.value = false;
        }
    }
}

function resolveGlossAssetUrl(path?: string) {
    if (!path) {
        return EMPTY_POSTER;
    }

    if (/^https?:\/\//u.test(path)) {
        return path;
    }

    const normalized = path.startsWith("/") ? path : `/${path}`;

    return `${GLOSS_MOD_WEB_BASE_URL}${normalized}`;
}

function formatDetailText(value?: string) {
    if (!value) {
        return [] as string[];
    }

    return value
        .replace(/<br\s*\/?>/giu, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/\r+/g, "\n")
        .split(/\n+/)
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter(Boolean);
}

function formatDate(value?: string) {
    if (!value) {
        return "未知时间";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return dateFormatter.format(parsed);
}

function toNumber(value?: string | number) {
    const normalized = typeof value === "number" ? value : Number(value ?? 0);

    return Number.isFinite(normalized) ? normalized : 0;
}

function formatNumber(value?: string | number) {
    return numberFormatter.format(toNumber(value));
}

function formatBytes(value?: string | number) {
    const bytes = toNumber(value);

    if (bytes <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const exponent = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );
    const amount = bytes / 1024 ** exponent;

    return `${amount >= 100 ? amount.toFixed(0) : amount.toFixed(1)} ${units[exponent]}`;
}

function formatSpeed(value?: string | number) {
    return `${formatBytes(value)}/s`;
}

function getTaskProgress(task: IAria2RpcTask) {
    const totalLength = toNumber(task.totalLength);

    if (totalLength <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round((toNumber(task.completedLength) / totalLength) * 100),
    );
}

function getTaskPrimaryFile(task: IAria2RpcTask) {
    return task.files.find((item) => item.path) ?? task.files[0] ?? null;
}

function getBaseName(filePath?: string) {
    if (!filePath) {
        return "";
    }

    return filePath.split(/[\\/]+/u).pop() ?? filePath;
}

function getTaskDisplayName(task: IAria2RpcTask) {
    const metadata = taskMetaMap.value[task.gid];

    if (metadata?.fileName) {
        return metadata.fileName;
    }

    if (metadata?.resourceName) {
        return metadata.resourceName;
    }

    if (task.bittorrent?.info?.name) {
        return task.bittorrent.info.name;
    }

    const primaryFile = getTaskPrimaryFile(task);

    if (primaryFile?.path) {
        return getBaseName(primaryFile.path);
    }

    return task.gid;
}

function getTaskStatusLabel(status: string) {
    return taskStatusLabels[status] ?? status;
}

function getTaskStatusClass(status: string) {
    if (status === "complete") {
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    }

    if (status === "active") {
        return "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300";
    }

    if (status === "paused") {
        return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
    }

    if (status === "error" || status === "removed") {
        return "border-destructive/30 bg-destructive/10 text-destructive";
    }

    return "border-border bg-muted/40 text-muted-foreground";
}

function sanitizeFileName(name: string) {
    return name.replace(/[<>:"/\\|?*\u0000-\u001F]/gu, "-").trim();
}

function getUrlFileName(url: string) {
    try {
        const parsed = new URL(url);
        const fileName = decodeURIComponent(
            parsed.pathname.split("/").pop() || "download.bin",
        );

        return sanitizeFileName(fileName) || "download.bin";
    } catch {
        return "download.bin";
    }
}

function hasExtension(fileName: string) {
    return /\.[A-Za-z0-9]{1,10}$/u.test(fileName);
}

function buildOutputFileName(resource: IResource) {
    const resourceName = sanitizeFileName(resource.mods_resource_name || "");

    if (!resourceName) {
        return getUrlFileName(resource.mods_resource_url);
    }

    if (hasExtension(resourceName)) {
        return resourceName;
    }

    const urlFileName = getUrlFileName(resource.mods_resource_url);
    const extension = /\.[A-Za-z0-9]{1,10}$/u.exec(urlFileName)?.[0] ?? "";

    return `${resourceName}${extension}`;
}

function setTaskMeta(gid: string, metadata: IAria2TaskMeta) {
    taskMetaMap.value = {
        ...taskMetaMap.value,
        [gid]: metadata,
    };
}

function removeTaskMeta(gid: string) {
    if (!taskMetaMap.value[gid]) {
        return;
    }

    const nextMap = { ...taskMetaMap.value };
    delete nextMap[gid];
    taskMetaMap.value = nextMap;
}

function startTaskOperation(gid: string) {
    if (taskOperatingIds.value.includes(gid)) {
        return;
    }

    taskOperatingIds.value = [...taskOperatingIds.value, gid];
}

function finishTaskOperation(gid: string) {
    taskOperatingIds.value = taskOperatingIds.value.filter((item) => item !== gid);
}

function isTaskOperating(gid: string) {
    return taskOperatingIds.value.includes(gid);
}

async function addResourceTask(resource: IResource) {
    if (!selectedMod.value) {
        return;
    }

    const resourceKey = `${selectedMod.value.id}-${resource.id ?? resource.mods_resource_name}`;
    addingResourceKey.value = resourceKey;

    try {
        const outputDirectory = await ensureDownloadDirectoryReady();
        await Aria2Rpc.ensureServer({ outputDirectory });

        const options: Record<string, string> = {
            dir: outputDirectory,
            out: buildOutputFileName(resource),
            continue: "true",
            "allow-overwrite": "true",
            split: "8",
            "max-connection-per-server": "8",
            "min-split-size": "1M",
            referer: `${GLOSS_MOD_WEB_BASE_URL}/mod/${selectedMod.value.id}`,
            "user-agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        };

        if (downloadProxy.value.trim()) {
            options["all-proxy"] = downloadProxy.value.trim();
        }

        const gid = await Aria2Rpc.addUri([resource.mods_resource_url], options);

        setTaskMeta(gid, {
            modId: selectedMod.value.id,
            modTitle: selectedMod.value.mods_title,
            gameName: selectedMod.value.game_name,
            resourceName: resource.mods_resource_name,
            fileName: buildOutputFileName(resource),
            author: selectedMod.value.mods_author,
            version:
                resource.mods_resource_version || selectedMod.value.mods_version,
            cover: resolveGlossAssetUrl(selectedMod.value.mods_image_url),
            content: selectedMod.value.mods_content,
            sourceUrl: `${GLOSS_MOD_WEB_BASE_URL}/mod/${selectedMod.value.id}`,
        });

        ElMessage.success(`已添加 ${resource.mods_resource_name} 到下载队列。`);
        await refreshTaskLists();
        selectedTaskGid.value = gid;
    } catch (error: unknown) {
        console.error("添加下载任务失败");
        console.error(error);
        ElMessage.error(getErrorMessage(error));
    } finally {
        addingResourceKey.value = "";
    }
}

async function pauseTask(task: IAria2RpcTask) {
    startTaskOperation(task.gid);

    try {
        await Aria2Rpc.pause(task.gid, true);
        await refreshTaskLists();
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error));
    } finally {
        finishTaskOperation(task.gid);
    }
}

async function resumeTask(task: IAria2RpcTask) {
    startTaskOperation(task.gid);

    try {
        await Aria2Rpc.unpause(task.gid);
        await refreshTaskLists();
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error));
    } finally {
        finishTaskOperation(task.gid);
    }
}

async function removeTask(task: IAria2RpcTask) {
    startTaskOperation(task.gid);

    try {
        if (["active", "waiting", "paused"].includes(task.status)) {
            await Aria2Rpc.remove(task.gid, true);
            await waitForRemovedTask(task.gid);
        }

        try {
            await Aria2Rpc.removeDownloadResult(task.gid);
        } catch {
            // 任务还未进入历史列表时会失败，这里直接忽略。
        }

        removeTaskMeta(task.gid);
        await refreshTaskLists();
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error));
    } finally {
        finishTaskOperation(task.gid);
    }
}

async function waitForRemovedTask(gid: string) {
    for (let index = 0; index < 6; index += 1) {
        try {
            const task = await Aria2Rpc.tellStatus(gid);

            if (["removed", "complete", "error"].includes(task.status)) {
                return;
            }
        } catch {
            return;
        }

        await new Promise((resolve) => globalThis.setTimeout(resolve, 250));
    }
}

async function purgeStoppedTasks() {
    try {
        await Aria2Rpc.purgeDownloadResult();

        const activeGids = new Set([
            ...activeTasks.value.map((task) => task.gid),
            ...waitingTasks.value.map((task) => task.gid),
        ]);
        const nextMap: Record<string, IAria2TaskMeta> = {};

        for (const gid of Object.keys(taskMetaMap.value)) {
            if (activeGids.has(gid)) {
                nextMap[gid] = taskMetaMap.value[gid];
            }
        }

        taskMetaMap.value = nextMap;
        await refreshTaskLists();
        ElMessage.success("已清理历史任务记录。");
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error));
    }
}

async function openTaskFolder(task?: IAria2RpcTask | null) {
    const target = task ?? selectedTask.value;

    if (!target?.dir) {
        ElMessage.warning("当前任务没有可用目录。");
        return;
    }

    await FileHandler.openFolder(target.dir);
}

async function openTaskFile(task?: IAria2RpcTask | null) {
    const targetTask = task ?? selectedTask.value;
    const primaryFile = targetTask ? getTaskPrimaryFile(targetTask) : null;

    if (!primaryFile?.path) {
        ElMessage.warning("当前任务没有可用文件。");
        return;
    }

    await FileHandler.openFile(primaryFile.path);
}

async function loadRelatedModDetail(task?: IAria2RpcTask | null) {
    const targetTask = task ?? selectedTask.value;

    if (!targetTask) {
        return;
    }

    const relatedModId = taskMetaMap.value[targetTask.gid]?.modId;

    if (!relatedModId) {
        ElMessage.warning("当前任务没有关联的 Mod 详情。");
        return;
    }

    modLookupInput.value = String(relatedModId);
    await loadModDetail(String(relatedModId));
}
</script>
<template>
    <div class="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <CardTitle class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl">下载中心</h1>
                        <Badge class="rounded-full" variant="secondary">
                            Aria2
                        </Badge>
                    </div>
                    <Badge class="rounded-full"
                        :class="getTaskStatusClass(rpcState === 'ready' ? 'active' : rpcState === 'error' ? 'error' : 'waiting')"
                        variant="outline">
                        {{ rpcState === "ready" ? "服务已连接" : rpcState === "starting" ? "服务启动中" : rpcState === "error" ?
                            "服务异常" : "等待启动" }}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    内置详情预览、任务管理和 aria2 下载队列。
                </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center gap-2">
                    <SelectGame />
                    <Button variant="outline" size="sm" @click="selectDownloadDirectory">
                        <IconFolderSearch />
                        选择下载目录
                    </Button>
                    <Button variant="outline" size="sm" @click="openDownloadDirectory">
                        <IconFolderOpen />
                        打开目录
                    </Button>
                    <Button variant="outline" size="sm" :disabled="refreshingTasks" @click="refreshTaskLists()">
                        <IconRefreshCw :class="refreshingTasks ? 'animate-spin' : ''" />
                        刷新任务
                    </Button>
                </div>

                <div class="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                    <div class="rounded-xl border bg-muted/20 px-4 py-3">
                        <div class="text-xs text-muted-foreground">当前下载目录</div>
                        <div class="mt-1 break-all text-sm font-medium leading-6">
                            {{ resolvedDownloadDirectory || "正在准备目录..." }}
                        </div>
                    </div>
                    <div class="rounded-xl border bg-muted/20 px-4 py-3">
                        <div class="text-xs text-muted-foreground">当前游戏</div>
                        <div class="mt-1 text-sm font-medium">
                            {{ currentGameLabel }}
                        </div>
                    </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div v-for="item in taskSummaryCards" :key="item.label" class="rounded-xl border px-4 py-3">
                        <div class="text-xs text-muted-foreground">
                            {{ item.label }}
                        </div>
                        <div class="mt-1 text-lg font-semibold tracking-tight">
                            {{ item.value }}
                        </div>
                    </div>
                </div>

                <div v-if="rpcErrorMessage"
                    class="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {{ rpcErrorMessage }}
                </div>
            </CardContent>
        </Card>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <Card>
                <CardHeader>
                    <CardTitle>添加 Mod</CardTitle>
                    <CardDescription>
                        输入 3DM Mod ID 或详情链接后，在页内直接预览并添加资源。
                    </CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col gap-4">
                    <div class="flex gap-2">
                        <Input v-model="modLookupInput" placeholder="例如：252329 或 https://mod.3dmgame.com/mod/252329" />
                        <Button :disabled="modLookupLoading" @click="loadModDetail()">
                            <IconSearch />
                            读取详情
                        </Button>
                    </div>

                    <div v-if="modLookupError"
                        class="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
                        {{ modLookupError }}
                    </div>

                    <div v-if="modLookupLoading" class="space-y-3 rounded-xl border p-4">
                        <div class="aspect-video animate-pulse rounded-xl bg-muted"></div>
                        <div class="h-6 w-2/3 animate-pulse rounded bg-muted"></div>
                        <div class="h-4 w-full animate-pulse rounded bg-muted"></div>
                        <div class="h-4 w-5/6 animate-pulse rounded bg-muted"></div>
                    </div>

                    <div v-else-if="!selectedMod"
                        class="flex min-h-70 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
                        <IconDownload class="size-8 text-muted-foreground" />
                        <div class="mt-3 text-base font-medium">等待载入 Mod 详情</div>
                        <p class="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                            读取成功后，这里会展示资源列表和内置详情。
                        </p>
                    </div>

                    <template v-else>
                        <div class="overflow-hidden rounded-xl border">
                            <img :src="resolveGlossAssetUrl(selectedMod.mods_image_url)" :alt="selectedMod.mods_title"
                                class="aspect-video w-full object-cover"
                                @error="(event) => ((event.target as HTMLImageElement).src = EMPTY_POSTER)" />
                        </div>

                        <div class="space-y-3">
                            <div>
                                <h2 class="text-xl font-semibold leading-8">
                                    {{ selectedMod.mods_title }}
                                </h2>
                                <p class="mt-1 text-sm text-muted-foreground">
                                    {{ selectedMod.game_name }} · {{ (selectedMod.mods_type_name || "").trim() || "未分类"
                                    }}
                                </p>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <Badge class="rounded-full" variant="outline">
                                    作者：{{ selectedMod.user_nickName || selectedMod.mods_author || "未知" }}
                                </Badge>
                                <Badge class="rounded-full" variant="outline">
                                    版本：{{ selectedMod.mods_version || "未知" }}
                                </Badge>
                                <Badge class="rounded-full" variant="outline">
                                    更新时间：{{ formatDate(selectedMod.mods_updateTime) }}
                                </Badge>
                                <Badge v-if="selectedMod.support_gmm" class="rounded-full" variant="secondary">
                                    支持 GMM
                                </Badge>
                            </div>

                            <div class="grid grid-cols-3 gap-3 text-center text-xs">
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">下载</div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{ formatNumber(selectedMod.mods_download_cnt) }}
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">浏览</div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{ formatNumber(selectedMod.mods_click_cnt) }}
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">收藏</div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{ formatNumber(selectedMod.mods_mark_cnt) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>内置详情</CardTitle>
                    <CardDescription>
                        资源会直接加入内置 aria2 队列，不再跳转网页端。
                    </CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col gap-4">
                    <template v-if="selectedMod">
                        <div class="rounded-xl border px-4 py-4 text-sm leading-7 text-muted-foreground">
                            <p v-if="selectedMod.mods_desc" class="whitespace-pre-wrap">
                                {{ selectedMod.mods_desc }}
                            </p>
                            <div v-if="detailParagraphs.length" class="mt-3 space-y-2">
                                <p v-for="(item, index) in detailParagraphs"
                                    :key="`${selectedMod.id}-paragraph-${index}`"
                                    class="rounded-lg bg-muted/35 px-3 py-2 text-foreground">
                                    {{ item }}
                                </p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="text-sm font-medium">资源列表</div>
                                <div class="text-xs text-muted-foreground">
                                    共 {{ selectedMod.mods_resource.length }} 个资源
                                </div>
                            </div>

                            <div class="space-y-3">
                                <div v-for="resource in selectedMod.mods_resource"
                                    :key="`${selectedMod.id}-${resource.id}`" class="rounded-xl border px-4 py-4">
                                    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div class="space-y-2">
                                            <div class="flex flex-wrap items-center gap-2">
                                                <div class="text-sm font-medium">
                                                    {{ resource.mods_resource_name }}
                                                </div>
                                                <Badge v-if="resource.mods_resource_latest_version" class="rounded-full"
                                                    variant="secondary">
                                                    最新
                                                </Badge>
                                            </div>
                                            <div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                <span>大小：{{ resource.mods_resource_size || "未知" }}</span>
                                                <span>·</span>
                                                <span>版本：{{ resource.mods_resource_version || selectedMod.mods_version
                                                    || "未知" }}</span>
                                                <span v-if="resource.mods_resource_formart">·</span>
                                                <span v-if="resource.mods_resource_formart">格式：{{
                                                    resource.mods_resource_formart }}</span>
                                            </div>
                                            <p v-if="resource.mods_resource_desc" class="text-sm text-muted-foreground">
                                                {{ resource.mods_resource_desc }}
                                            </p>
                                        </div>

                                        <Button size="sm"
                                            :disabled="addingResourceKey === `${selectedMod.id}-${resource.id ?? resource.mods_resource_name}`"
                                            @click="addResourceTask(resource)">
                                            <IconPlus />
                                            {{ addingResourceKey === `${selectedMod.id}-${resource.id ??
                                                resource.mods_resource_name}` ? "添加中" : "添加到下载队列" }}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <div v-else
                        class="flex min-h-70 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
                        <IconPanelRight class="size-8 text-muted-foreground" />
                        <div class="mt-3 text-base font-medium">这里显示 Mod 详情和资源</div>
                        <p class="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                            加载 Mod 后即可在页内查看介绍、资源版本和下载按钮。
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Card>
                <CardHeader>
                    <CardTitle class="flex flex-wrap items-center justify-between gap-3">
                        <span>下载任务列表</span>
                        <div class="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" :disabled="refreshingTasks" @click="refreshTaskLists()">
                                <IconRefreshCw :class="refreshingTasks ? 'animate-spin' : ''" />
                                刷新
                            </Button>
                            <Button size="sm" variant="outline" @click="purgeStoppedTasks">
                                <IconTrash2 />
                                清理记录
                            </Button>
                        </div>
                    </CardTitle>
                    <CardDescription>
                        查看、暂停、继续、删除当前 aria2 下载任务。
                    </CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col gap-4">
                    <div class="flex flex-wrap gap-2">
                        <Button v-for="item in queueFilterOptions" :key="item.value" size="sm"
                            :variant="queueFilter === item.value ? 'default' : 'outline'"
                            @click="queueFilter = item.value">
                            {{ item.label }}
                            <span class="text-xs opacity-70">{{ item.count }}</span>
                        </Button>
                    </div>

                    <div v-if="!filteredTasks.length" class="rounded-xl border border-dashed px-6 py-10 text-center">
                        <div class="text-base font-medium">当前没有任务</div>
                        <p class="mt-2 text-sm leading-6 text-muted-foreground">
                            读取 Mod 详情后点击资源按钮，任务会直接出现在这里。
                        </p>
                    </div>

                    <div v-else class="space-y-3">
                        <article v-for="task in filteredTasks" :key="task.gid"
                            class="cursor-pointer rounded-xl border px-4 py-4 transition-colors hover:border-primary/40"
                            :class="selectedTaskGid === task.gid ? 'border-primary/50 bg-primary/5' : ''"
                            @click="selectedTaskGid = task.gid">
                            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div class="min-w-0 flex-1 space-y-2">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <div class="truncate text-sm font-medium">
                                            {{ getTaskDisplayName(task) }}
                                        </div>
                                        <Badge class="rounded-full" :class="getTaskStatusClass(task.status)"
                                            variant="outline">
                                            {{ getTaskStatusLabel(task.status) }}
                                        </Badge>
                                        <Badge v-if="taskMetaMap[task.gid]?.modTitle" class="rounded-full"
                                            variant="outline">
                                            {{ taskMetaMap[task.gid]?.modTitle }}
                                        </Badge>
                                    </div>

                                    <div class="h-2 overflow-hidden rounded-full bg-muted">
                                        <div class="h-full rounded-full bg-primary transition-all"
                                            :style="{ width: `${getTaskProgress(task)}%` }"></div>
                                    </div>

                                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                        <span>{{ formatBytes(task.completedLength) }} / {{ formatBytes(task.totalLength)
                                        }}</span>
                                        <span>速度：{{ formatSpeed(task.downloadSpeed) }}</span>
                                        <span>连接：{{ formatNumber(task.connections) }}</span>
                                        <span v-if="task.errorMessage">错误：{{ task.errorMessage }}</span>
                                    </div>
                                </div>

                                <div class="flex flex-wrap gap-2" @click.stop>
                                    <Button size="sm" variant="outline" @click="selectedTaskGid = task.gid">
                                        <IconEye />
                                        查看
                                    </Button>
                                    <Button v-if="task.status === 'active' || task.status === 'waiting'" size="sm"
                                        variant="outline" :disabled="isTaskOperating(task.gid)"
                                        @click="pauseTask(task)">
                                        <IconPause />
                                        暂停
                                    </Button>
                                    <Button v-else-if="task.status === 'paused'" size="sm" variant="outline"
                                        :disabled="isTaskOperating(task.gid)" @click="resumeTask(task)">
                                        <IconPlay />
                                        继续
                                    </Button>
                                    <Button size="sm" variant="outline" :disabled="isTaskOperating(task.gid)"
                                        @click="removeTask(task)">
                                        <IconTrash2 />
                                        删除
                                    </Button>
                                </div>
                            </div>
                        </article>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>任务详情</CardTitle>
                    <CardDescription>
                        选中任务后可查看文件、目录、速度和关联 Mod。
                    </CardDescription>
                </CardHeader>
                <CardContent class="flex flex-col gap-4">
                    <template v-if="selectedTask">
                        <div class="space-y-3">
                            <div class="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div class="text-lg font-semibold leading-7">
                                        {{ getTaskDisplayName(selectedTask) }}
                                    </div>
                                    <div class="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span>GID：{{ selectedTask.gid }}</span>
                                        <span>·</span>
                                        <span>{{ getTaskStatusLabel(selectedTask.status) }}</span>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" @click="openTaskFolder(selectedTask)">
                                        <IconFolderOpen />
                                        打开目录
                                    </Button>
                                    <Button size="sm" variant="outline" :disabled="selectedTask.status !== 'complete'"
                                        @click="openTaskFile(selectedTask)">
                                        <IconFileUp />
                                        打开文件
                                    </Button>
                                    <Button v-if="selectedTaskMeta?.modId" size="sm" variant="outline"
                                        @click="loadRelatedModDetail(selectedTask)">
                                        <IconPanelRightOpen />
                                        加载关联 Mod
                                    </Button>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3 text-center text-xs">
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">进度</div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{ getTaskProgress(selectedTask) }}%
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">速度</div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{ formatSpeed(selectedTask.downloadSpeed) }}
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">已下载</div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{ formatBytes(selectedTask.completedLength) }}
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">总大小</div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{ formatBytes(selectedTask.totalLength) }}
                                    </div>
                                </div>
                            </div>

                            <div class="rounded-xl border px-4 py-3 text-sm">
                                <div class="text-xs text-muted-foreground">保存目录</div>
                                <div class="mt-1 break-all leading-6">
                                    {{ selectedTask.dir || "未知目录" }}
                                </div>
                            </div>

                            <div v-if="selectedTaskMeta" class="rounded-xl border px-4 py-3 text-sm">
                                <div class="text-xs text-muted-foreground">关联 Mod</div>
                                <div class="mt-1 font-medium">
                                    {{ selectedTaskMeta.modTitle || "未知 Mod" }}
                                </div>
                                <div class="mt-1 text-xs text-muted-foreground">
                                    {{ selectedTaskMeta.gameName || "未记录游戏" }}
                                    <span v-if="selectedTaskMeta.version">· 版本 {{ selectedTaskMeta.version }}</span>
                                </div>
                            </div>

                            <div v-if="selectedTask.errorMessage"
                                class="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                {{ selectedTask.errorMessage }}
                            </div>

                            <div class="space-y-3">
                                <div class="text-sm font-medium">文件列表</div>
                                <div class="space-y-2">
                                    <div v-for="(file, index) in selectedTask.files"
                                        :key="`${selectedTask.gid}-${index}`"
                                        class="rounded-xl border px-3 py-3 text-sm">
                                        <div class="font-medium">
                                            {{ getBaseName(file.path) || `文件 ${index + 1}` }}
                                        </div>
                                        <div class="mt-1 text-xs text-muted-foreground">
                                            {{ formatBytes(file.completedLength) }} / {{ formatBytes(file.length) }}
                                        </div>
                                        <div class="mt-2 break-all text-xs text-muted-foreground">
                                            {{ file.path || "暂无文件路径" }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <div v-else
                        class="flex min-h-90 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
                        <IconListChecks class="size-8 text-muted-foreground" />
                        <div class="mt-3 text-base font-medium">先选择一个任务</div>
                        <p class="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                            这里会展示任务状态、保存目录、文件列表和关联的 Mod 信息。
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
<style scoped></style>
