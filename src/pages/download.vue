<script setup lang="ts">
import { documentDir, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { fetch as httpFetch } from "@tauri-apps/plugin-http";
import { ElMessage } from "element-plus-message";
import {
    Aria2Rpc,
    type IAria2GlobalStat,
    type IAria2RpcEnsureOptions,
    type IAria2RpcTask,
    type IAria2RuntimeSettings,
} from "@/lib/aria2-rpc";
import {
    importLocalModSources,
    type ILocalModImportSource,
} from "@/lib/local-mod-import";
import {
    buildUniqueGlossFileName,
    findGlossDuplicateLocalMods,
    findGlossDuplicateTasks,
    getGlossModPresence,
    type IGlossDownloadTaskMeta,
} from "@/lib/gloss-download";
import { autoImportCompletedDownloadTasks } from "@/lib/gloss-download-monitor";
import {
    buildGlossOutputFileName,
    resolveGlossDownloadImportSourceType,
} from "@/lib/gloss-download-queue";

type QueueFilter = "all" | "active" | "waiting" | "paused" | "stopped";
type DuplicateDecisionAction =
    | "cancel"
    | "continue"
    | "overwrite"
    | "keep-both";

interface IGlossApiResponse<T> {
    success: boolean;
    msg: string;
    data: T | null;
}

interface IDuplicateDialogItem {
    title: string;
    description: string;
    badges: string[];
}

interface IDuplicateDialogOption {
    value: DuplicateDecisionAction;
    label: string;
    description: string;
    variant?: "default" | "outline" | "destructive";
}

interface IDuplicateDialogState {
    open: boolean;
    title: string;
    description: string;
    note: string;
    items: IDuplicateDialogItem[];
    options: IDuplicateDialogOption[];
}

interface IPageItem {
    key: string;
    label: string;
    page?: number;
    ellipsis?: boolean;
}

interface IAddResourceTaskResult {
    handled: boolean;
    gid: string | null;
}

interface IResourceDuplicateTask {
    task: IAria2RpcTask;
    meta: IGlossDownloadTaskMeta;
    score: number;
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
    waiting: "等待中",
    paused: "已暂停",
    stopped: "已结束",
};
const taskStatusLabels: Record<string, string> = {
    active: "下载中",
    waiting: "等待中",
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
const DEFAULT_TASK_PAGE_SIZE = "20";
const TASK_PAGE_SIZE_OPTIONS = ["20", "50", "100"];
const TASK_STATUS_SORT_ORDER: Record<string, number> = {
    active: 0,
    waiting: 1,
    paused: 2,
    complete: 3,
    error: 4,
    removed: 5,
};

const manager = useManager();
const settings = useSettings();
const route = useRoute();
const router = useRouter();
const { storagePath } = storeToRefs(settings);

const disableSymlinkInstall = PersistentStore.useValue<boolean>(
    "disableSymlinkInstall",
    false,
);
const downloadDirectory = PersistentStore.useValue<string>(
    "downloadDirectory",
    "",
);
const downloadProxy = PersistentStore.useValue<string>("downloadProxy", "");
const aria2Settings = PersistentStore.useValue<IAria2RuntimeSettings>(
    "aria2Settings",
    Aria2Rpc.getDefaultSettings(),
);
const taskMetaMap = PersistentStore.useValue<
    Record<string, IGlossDownloadTaskMeta>
>("aria2TaskMetaMap", {});

const rpcState = ref<"idle" | "starting" | "ready" | "error">("idle");
const rpcErrorMessage = ref("");
const refreshingTasks = ref(false);
const globalStat = ref<IAria2GlobalStat>(defaultGlobalStat());
const activeTasks = ref<IAria2RpcTask[]>([]);
const waitingTasks = ref<IAria2RpcTask[]>([]);
const stoppedTasks = ref<IAria2RpcTask[]>([]);
const taskOperatingIds = ref<string[]>([]);
const taskImportingIds = ref<string[]>([]);

const modLookupInput = ref("");
const modLookupLoading = ref(false);
const modLookupError = ref("");
const selectedMod = ref<IMod | null>(null);
const addingResourceKey = ref("");

const queueFilter = ref<QueueFilter>("all");
const taskPage = ref(1);
const taskPageSize = ref(DEFAULT_TASK_PAGE_SIZE);
const selectedTaskGid = ref("");
const defaultDownloadDirectory = ref("");
const showAddModDialog = ref(false);
const showTaskDetailDialog = ref(false);
const showAria2SettingsDialog = ref(false);
const duplicateDialog = reactive<IDuplicateDialogState>({
    open: false,
    title: "",
    description: "",
    note: "",
    items: [],
    options: [],
});
const aria2SettingsDraft = ref<IAria2RuntimeSettings>(
    Aria2Rpc.getDefaultSettings(),
);
const downloadProxyDraft = ref("");

let refreshSequence = 0;
let detailSequence = 0;
let duplicateDialogResolver:
    | ((action: DuplicateDecisionAction) => void)
    | null = null;
let hasCompletedInitialTaskSync = false;

const normalizedAria2Settings = computed(() =>
    Aria2Rpc.normalizeSettings(aria2Settings.value),
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
    let tasks: IAria2RpcTask[] = [];

    switch (queueFilter.value) {
        case "active":
            tasks = activeTasks.value;
            break;
        case "waiting":
            tasks = waitingQueueTasks.value;
            break;
        case "paused":
            tasks = pausedTasks.value;
            break;
        case "stopped":
            tasks = stoppedTasks.value;
            break;
        default:
            tasks = allTasks.value;
            break;
    }

    return sortTasksByCreatedAt(tasks);
});
const taskPageSizeNumber = computed(() => Number(taskPageSize.value));
const filteredTaskCount = computed(() => filteredTasks.value.length);
const paginatedTasks = computed(() => {
    const startIndex = (taskPage.value - 1) * taskPageSizeNumber.value;
    return filteredTasks.value.slice(
        startIndex,
        startIndex + taskPageSizeNumber.value,
    );
});
const taskTotalPages = computed(() => {
    if (filteredTaskCount.value === 0) {
        return 0;
    }

    return Math.ceil(filteredTaskCount.value / taskPageSizeNumber.value);
});
const visibleTaskRangeLabel = computed(() => {
    if (filteredTaskCount.value === 0) {
        return "暂无任务";
    }

    const startIndex = (taskPage.value - 1) * taskPageSizeNumber.value + 1;
    const endIndex = startIndex + paginatedTasks.value.length - 1;

    return `显示第 ${startIndex}-${endIndex} 条，共 ${filteredTaskCount.value} 条`;
});
const taskPaginationItems = computed<IPageItem[]>(() => {
    if (taskTotalPages.value <= 1) {
        return [];
    }

    const pages = new Set<number>([
        1,
        taskTotalPages.value,
        taskPage.value - 1,
        taskPage.value,
        taskPage.value + 1,
    ]);

    if (taskPage.value <= 3) {
        pages.add(2);
        pages.add(3);
        pages.add(4);
    }

    if (taskPage.value >= taskTotalPages.value - 2) {
        pages.add(taskTotalPages.value - 1);
        pages.add(taskTotalPages.value - 2);
        pages.add(taskTotalPages.value - 3);
    }

    const sortedPages = [...pages]
        .filter((value) => value >= 1 && value <= taskTotalPages.value)
        .sort((left, right) => left - right);

    const items: IPageItem[] = [];
    let previousPage = 0;

    for (const value of sortedPages) {
        if (value - previousPage > 1) {
            items.push({
                key: `ellipsis-${previousPage}-${value}`,
                label: "...",
                ellipsis: true,
            });
        }

        items.push({
            key: `page-${value}`,
            label: String(value),
            page: value,
        });
        previousPage = value;
    }

    return items;
});
const selectedTask = computed(
    () =>
        allTasks.value.find((task) => task.gid === selectedTaskGid.value) ??
        null,
);
const selectedTaskMeta = computed(
    () => taskMetaMap.value[selectedTaskGid.value] ?? null,
);
const canImportToLocalManager = computed(() =>
    Boolean(storagePath.value && manager.managerGame),
);

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
    formatDetailText(
        selectedMod.value?.mods_content || selectedMod.value?.mods_desc,
    ),
);

function getTaskSourceType(
    metadata?: IGlossDownloadTaskMeta | null,
): sourceType {
    return metadata?.sourceType ?? (metadata?.modId ? "GlossMod" : "Customize");
}

function getTaskExternalId(metadata?: IGlossDownloadTaskMeta | null) {
    return metadata?.externalId ?? metadata?.modId;
}

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

watch(queueFilter, () => {
    taskPage.value = 1;
});

watch(taskPageSize, () => {
    taskPage.value = 1;
});

watch(
    filteredTaskCount,
    (count) => {
        if (count === 0) {
            taskPage.value = 1;
            return;
        }

        const maxPage = Math.ceil(count / taskPageSizeNumber.value);

        if (taskPage.value > maxPage) {
            taskPage.value = maxPage;
        }
    },
    { immediate: true },
);

watch(
    [storagePath, () => manager.managerGame?.gameName, disableSymlinkInstall],
    () => {
        void refreshDefaultDownloadDirectory();
        void manager.refreshRuntimeData({
            storagePath: storagePath.value,
            closeSoftLinks: disableSymlinkInstall.value,
        });
    },
    { immediate: true },
);

watch(
    () =>
        [route.query.modId, route.query.resourceId, route.query.autoDownload]
            .map((item) => (typeof item === "string" ? item : ""))
            .join("|"),
    () => {
        void handleRouteModIntent();
    },
    { immediate: true },
);

watch(
    () => duplicateDialog.open,
    (open) => {
        if (!open && duplicateDialogResolver) {
            const resolver = duplicateDialogResolver;

            duplicateDialogResolver = null;
            resolver("cancel");
        }
    },
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

function buildRpcEnsureOptions(
    outputDirectory?: string,
): IAria2RpcEnsureOptions {
    const settings = normalizedAria2Settings.value;

    return {
        outputDirectory: outputDirectory || resolvedDownloadDirectory.value,
        listenPort: settings.rpcPort,
        secret: settings.rpcSecret,
        maxConcurrentDownloads: settings.maxConcurrentDownloads,
        split: settings.split,
        maxConnectionPerServer: settings.maxConnectionPerServer,
        minSplitSize: settings.minSplitSize,
    };
}

function openAddModDialog() {
    showAddModDialog.value = true;
}

function openTaskDetail(task: IAria2RpcTask) {
    selectedTaskGid.value = task.gid;
    showTaskDetailDialog.value = true;
}

function openAria2SettingsDialog() {
    aria2SettingsDraft.value = Aria2Rpc.normalizeSettings(aria2Settings.value);
    downloadProxyDraft.value = downloadProxy.value ?? "";
    showAria2SettingsDialog.value = true;
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

    defaultDownloadDirectory.value = await join(baseDirectory, "downloads");
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

async function ensureRpcReady() {
    const outputDirectory = await ensureDownloadDirectoryReady();

    await Aria2Rpc.ensureServer(buildRpcEnsureOptions(outputDirectory));

    return outputDirectory;
}

async function initializeDownloadPage() {
    try {
        rpcState.value = "starting";
        rpcErrorMessage.value = "";
        await ensureRpcReady();
        rpcState.value = "ready";
        await refreshTaskLists();
        startTaskPolling();
    } catch (error: unknown) {
        rpcState.value = "error";
        rpcErrorMessage.value = getErrorMessage(error);
    }
}

function shouldAutoDownloadFromRoute() {
    const flag =
        typeof route.query.autoDownload === "string"
            ? route.query.autoDownload.trim().toLowerCase()
            : "";

    return ["1", "true", "yes"].includes(flag);
}

function getLatestResource(mod?: IMod | null) {
    return (
        mod?.mods_resource.find(
            (resource) => resource.mods_resource_latest_version,
        ) ??
        mod?.mods_resource[0] ??
        null
    );
}

async function clearRouteDownloadIntent(modId: string) {
    if (
        typeof route.query.resourceId !== "string" &&
        typeof route.query.autoDownload !== "string"
    ) {
        return;
    }

    await router.replace({
        path: route.path,
        query: modId ? { modId } : {},
    });
}

async function handleRouteModIntent() {
    const modId =
        typeof route.query.modId === "string"
            ? extractModId(route.query.modId)
            : "";

    if (!modId) {
        return;
    }

    // showAddModDialog.value = true;
    modLookupInput.value = modId;

    const mod = await loadModDetail(modId);

    if (!mod || !shouldAutoDownloadFromRoute()) {
        return;
    }

    const routeResourceId =
        typeof route.query.resourceId === "string"
            ? route.query.resourceId.trim()
            : "";

    if (!routeResourceId) {
        return;
    }

    const resource =
        routeResourceId === "latest"
            ? getLatestResource(mod)
            : (mod.mods_resource.find(
                  (item) => String(item.id) === routeResourceId,
              ) ?? null);

    if (!resource) {
        ElMessage.warning("未找到要下载的资源。");
        await clearRouteDownloadIntent(modId);
        return;
    }

    const result = await addResourceTask(resource);

    if (result.handled) {
        await clearRouteDownloadIntent(modId);
    }
}

async function refreshTaskLists(silent: boolean = false) {
    const currentSequence = ++refreshSequence;

    if (!silent) {
        refreshingTasks.value = true;
    }

    try {
        await ensureRpcReady();

        const [stat, active, waiting, stopped] = await Promise.all([
            Aria2Rpc.getGlobalStat(),
            Aria2Rpc.tellActive(),
            Aria2Rpc.tellWaiting(0, 100),
            Aria2Rpc.tellStopped(0, 100),
        ]);

        if (currentSequence !== refreshSequence) {
            return;
        }

        const allLatestTasks = [...active, ...waiting, ...stopped];
        const newlyCompletedTaskGids = syncTaskMetaStatuses(allLatestTasks);

        globalStat.value = stat;
        activeTasks.value = active;
        waitingTasks.value = waiting;
        stoppedTasks.value = stopped;
        rpcState.value = "ready";
        rpcErrorMessage.value = "";

        if (!hasCompletedInitialTaskSync) {
            hasCompletedInitialTaskSync = true;
            return;
        }

        if (newlyCompletedTaskGids.length > 0) {
            void autoImportCompletedTasks(
                newlyCompletedTaskGids,
                allLatestTasks,
            );
        }
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
    await restartAria2Service("下载目录已更新。");
}

async function openDownloadDirectory() {
    const directory = await ensureDownloadDirectoryReady();
    await FileHandler.openFolder(directory);
}

async function restartAria2Service(successMessage?: string) {
    try {
        stopTaskPolling();
        rpcState.value = "starting";
        rpcErrorMessage.value = "";

        const outputDirectory = await ensureDownloadDirectoryReady();
        await Aria2Rpc.restartServer(buildRpcEnsureOptions(outputDirectory));

        rpcState.value = "ready";
        await refreshTaskLists();
        startTaskPolling();

        if (successMessage) {
            ElMessage.success(successMessage);
        }
    } catch (error: unknown) {
        rpcState.value = "error";
        rpcErrorMessage.value = getErrorMessage(error);
        ElMessage.error(rpcErrorMessage.value);
    }
}

async function saveAria2Settings() {
    aria2Settings.value = Aria2Rpc.normalizeSettings(aria2SettingsDraft.value);
    downloadProxy.value = (downloadProxyDraft.value ?? "").trim();
    showAria2SettingsDialog.value = false;

    await restartAria2Service("Aria2 配置已保存。");
}

async function loadModDetail(explicitModId?: string): Promise<IMod | null> {
    const modId = explicitModId ?? extractModId(modLookupInput.value);

    if (!modId) {
        modLookupError.value = "请输入有效的 3DM Mod ID 或详情链接。";
        selectedMod.value = null;
        return null;
    }

    if (!GLOSS_MOD_KEY) {
        modLookupError.value = "未读取到 GLOSS_MOD_KEY，请检查 .env 配置。";
        selectedMod.value = null;
        return null;
    }

    const currentSequence = ++detailSequence;
    modLookupLoading.value = true;
    modLookupError.value = "";

    try {
        const response = await httpFetch(
            `${GLOSS_MOD_API_BASE_URL}/mods/${modId}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: GLOSS_MOD_KEY,
                },
            },
        );
        const payload = (await response.json()) as IGlossApiResponse<IMod>;

        if (currentSequence !== detailSequence) {
            return null;
        }

        if (!response.ok || !payload.success || !payload.data) {
            throw new Error(payload.msg || "读取 Mod 详情失败");
        }

        selectedMod.value = payload.data;
        modLookupInput.value = String(payload.data.id);
        return payload.data;
    } catch (error: unknown) {
        if (currentSequence !== detailSequence) {
            return null;
        }

        selectedMod.value = null;
        modLookupError.value = getErrorMessage(error);
        return null;
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

function parseTaskTimestamp(value?: string) {
    if (!value) {
        return 0;
    }

    const timestamp = Date.parse(value);

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getTaskCreatedTimestamp(task: IAria2RpcTask) {
    const metadata = taskMetaMap.value[task.gid];

    return (
        parseTaskTimestamp(metadata?.createdAt) ||
        parseTaskTimestamp(metadata?.updatedAt)
    );
}

function getTaskStatusSortOrder(status: string) {
    return TASK_STATUS_SORT_ORDER[status] ?? Number.MAX_SAFE_INTEGER;
}

function sortTasksByCreatedAt(tasks: IAria2RpcTask[]) {
    return [...tasks].sort((left, right) => {
        const statusDifference =
            getTaskStatusSortOrder(left.status) -
            getTaskStatusSortOrder(right.status);

        if (statusDifference !== 0) {
            return statusDifference;
        }

        const timestampDifference =
            getTaskCreatedTimestamp(right) - getTaskCreatedTimestamp(left);

        if (timestampDifference !== 0) {
            return timestampDifference;
        }

        return right.gid.localeCompare(left.gid);
    });
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

function goToTaskPage(nextPage: number) {
    if (taskTotalPages.value <= 0) {
        taskPage.value = 1;
        return;
    }

    taskPage.value = Math.min(Math.max(1, nextPage), taskTotalPages.value);
}

function buildOutputFileName(resource: IResource) {
    return buildGlossOutputFileName(resource);
}

function syncTaskMetaStatuses(tasks: IAria2RpcTask[]) {
    const nextMap = { ...taskMetaMap.value };
    let changed = false;
    const newlyCompletedTaskGids: string[] = [];

    for (const task of tasks) {
        const currentMeta = nextMap[task.gid];

        if (!currentMeta) {
            continue;
        }

        const nextMeta: IGlossDownloadTaskMeta = {
            ...currentMeta,
            createdAt:
                currentMeta.createdAt ||
                currentMeta.downloadedAt ||
                currentMeta.importedAt ||
                currentMeta.updatedAt ||
                new Date().toISOString(),
            taskStatus: task.status as TaskStatus,
            updatedAt: new Date().toISOString(),
        };

        if (
            task.status === "complete" &&
            currentMeta.taskStatus !== "complete"
        ) {
            newlyCompletedTaskGids.push(task.gid);
        }

        if (task.status === "complete" && !currentMeta.downloadedAt) {
            nextMeta.downloadedAt = new Date().toISOString();
        }

        if (
            nextMeta.createdAt !== currentMeta.createdAt ||
            nextMeta.taskStatus !== currentMeta.taskStatus ||
            nextMeta.downloadedAt !== currentMeta.downloadedAt
        ) {
            nextMap[task.gid] = nextMeta;
            changed = true;
        }
    }

    if (changed) {
        taskMetaMap.value = nextMap;
    }

    return newlyCompletedTaskGids;
}

async function autoImportCompletedTasks(
    completedTaskGids: string[],
    tasks: IAria2RpcTask[],
) {
    await autoImportCompletedDownloadTasks(
        manager,
        {
            autoAddAfterDownload: settings.autoAddAfterDownload,
            storagePath: storagePath.value,
            closeSoftLinks: disableSymlinkInstall.value,
        },
        completedTaskGids,
        tasks,
    );
}

function getDuplicateDialogItemBadges(
    task: IAria2RpcTask,
    metadata: IGlossDownloadTaskMeta,
) {
    const badges = [getTaskStatusLabel(task.status)];

    if (metadata.resourceName) {
        badges.push(metadata.resourceName);
    }

    if (metadata.fileName) {
        badges.push(metadata.fileName);
    }

    return badges;
}

function resolveDuplicateDialog(action: DuplicateDecisionAction) {
    const resolver = duplicateDialogResolver;

    duplicateDialogResolver = null;
    duplicateDialog.open = false;
    duplicateDialog.title = "";
    duplicateDialog.description = "";
    duplicateDialog.note = "";
    duplicateDialog.items = [];
    duplicateDialog.options = [];
    resolver?.(action);
}

function promptDuplicateDecision(options: {
    title: string;
    description: string;
    note?: string;
    items: IDuplicateDialogItem[];
    actions: IDuplicateDialogOption[];
}) {
    if (duplicateDialogResolver) {
        resolveDuplicateDialog("cancel");
    }

    duplicateDialog.title = options.title;
    duplicateDialog.description = options.description;
    duplicateDialog.note = options.note ?? "";
    duplicateDialog.items = options.items;
    duplicateDialog.options = options.actions;
    duplicateDialog.open = true;

    return new Promise<DuplicateDecisionAction>((resolve) => {
        duplicateDialogResolver = resolve;
    });
}

function findResourceDuplicateTasks(resource: IResource) {
    if (!selectedMod.value) {
        return [] as IResourceDuplicateTask[];
    }

    return findGlossDuplicateTasks(taskMetaMap.value, {
        modId: selectedMod.value.id,
        resourceId: resource.id,
        downloadUrl: resource.mods_resource_url,
        fileName: buildOutputFileName(resource),
        modTitle: selectedMod.value.mods_title,
    })
        .map((item) => {
            const task = allTasks.value.find(
                (current) => current.gid === item.gid,
            );

            if (!task) {
                return null;
            }

            return {
                task,
                meta: item.meta,
                score: item.score,
            };
        })
        .filter((item): item is IResourceDuplicateTask => item !== null)
        .filter((item) => item.task.status !== "removed");
}

function getResourcePresence(resource: IResource) {
    if (!selectedMod.value) {
        return getGlossModPresence(
            taskMetaMap.value,
            manager.managerModList,
            {},
        );
    }

    return getGlossModPresence(taskMetaMap.value, manager.managerModList, {
        modId: selectedMod.value.id,
        resourceId: resource.id,
        downloadUrl: resource.mods_resource_url,
        fileName: buildOutputFileName(resource),
        modTitle: selectedMod.value.mods_title,
    });
}

function getResourceActionLabel(resource: IResource) {
    const presence = getResourcePresence(resource);

    switch (presence.state) {
        case "active":
            return "查看下载";
        case "waiting":
            return "已在队列";
        case "paused":
            return "继续处理";
        case "error":
            return "重试或处理";
        case "complete":
            return "已下载";
        case "imported":
            return "已在本地";
        default:
            return "添加到下载队列";
    }
}

function getAllDuplicateTaskFileNames(resource: IResource) {
    const fileNames = findResourceDuplicateTasks(resource)
        .map((item) => item.meta.fileName || getTaskDisplayName(item.task))
        .filter(Boolean);

    fileNames.push(buildOutputFileName(resource));
    return fileNames;
}

function getTaskRetryUris(task: IAria2RpcTask) {
    const uriSet = new Set<string>();
    const metadataDownloadUrl =
        taskMetaMap.value[task.gid]?.downloadUrl?.trim();

    if (metadataDownloadUrl) {
        uriSet.add(metadataDownloadUrl);
    }

    for (const file of task.files) {
        for (const item of file.uris ?? []) {
            const normalizedUri = item.uri?.trim();

            if (!normalizedUri) {
                continue;
            }

            uriSet.add(normalizedUri);
        }
    }

    return [...uriSet];
}

function getTaskOutputFileName(task: IAria2RpcTask) {
    const metadata = taskMetaMap.value[task.gid];

    if (metadata?.fileName) {
        return metadata.fileName;
    }

    const primaryFile = getTaskPrimaryFile(task);

    if (primaryFile?.path) {
        return getBaseName(primaryFile.path);
    }

    return "download.bin";
}

function setTaskMeta(gid: string, metadata: IGlossDownloadTaskMeta) {
    const nextMeta: IGlossDownloadTaskMeta = {
        ...taskMetaMap.value[gid],
        ...metadata,
    };

    if (!nextMeta.createdAt) {
        nextMeta.createdAt = new Date().toISOString();
    }

    taskMetaMap.value = {
        ...taskMetaMap.value,
        [gid]: nextMeta,
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
    taskOperatingIds.value = taskOperatingIds.value.filter(
        (item) => item !== gid,
    );
}

function isTaskOperating(gid: string) {
    return taskOperatingIds.value.includes(gid);
}

async function createResourceTask(resource: IResource, outputFileName: string) {
    if (!selectedMod.value) {
        return null;
    }

    const resourceKey = `${selectedMod.value.id}-${resource.id ?? resource.mods_resource_name}`;
    addingResourceKey.value = resourceKey;

    try {
        const outputDirectory = await ensureRpcReady();
        const settings = normalizedAria2Settings.value;
        const trimmedProxy = (downloadProxy.value ?? "").trim();

        const options: Record<string, string> = {
            dir: outputDirectory,
            out: outputFileName,
            continue: "true",
            "allow-overwrite": "true",
            split: String(settings.split),
            "max-connection-per-server": String(
                settings.maxConnectionPerServer,
            ),
            "min-split-size": settings.minSplitSize,
            referer: `${GLOSS_MOD_WEB_BASE_URL}/mod/${selectedMod.value.id}`,
            "user-agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        };

        if (trimmedProxy) {
            options["all-proxy"] = trimmedProxy;
        }

        const gid = await Aria2Rpc.addUri(
            [resource.mods_resource_url],
            options,
        );
        const now = new Date().toISOString();

        setTaskMeta(gid, {
            sourceType: "GlossMod",
            externalId: selectedMod.value.id,
            modId: selectedMod.value.id,
            resourceId: resource.id,
            resourceFormat: resource.mods_resource_formart,
            modTitle: selectedMod.value.mods_title,
            gameName: selectedMod.value.game_name,
            resourceName: resource.mods_resource_name,
            fileName: outputFileName,
            author: selectedMod.value.mods_author,
            version:
                resource.mods_resource_version ||
                selectedMod.value.mods_version,
            cover: resolveGlossAssetUrl(selectedMod.value.mods_image_url),
            content: selectedMod.value.mods_content,
            sourceUrl: `${GLOSS_MOD_WEB_BASE_URL}/mod/${selectedMod.value.id}`,
            downloadUrl: resource.mods_resource_url,
            createdAt: now,
            taskStatus: "waiting",
            updatedAt: now,
        });

        ElMessage.success(`已添加 ${resource.mods_resource_name} 到下载队列。`);
        await refreshTaskLists();
        selectedTaskGid.value = gid;
        showAddModDialog.value = false;
        return gid;
    } catch (error: unknown) {
        console.error("添加下载任务失败");
        console.error(error);
        ElMessage.error(getErrorMessage(error));
        return null;
    } finally {
        addingResourceKey.value = "";
    }
}

async function continueExistingTask(task: IAria2RpcTask) {
    showAddModDialog.value = false;

    if (task.status === "paused") {
        await resumeTask(task);
        selectedTaskGid.value = task.gid;
        showTaskDetailDialog.value = true;
        ElMessage.success(`已继续现有任务：${getTaskDisplayName(task)}`);
        return task.gid;
    }

    if (task.status === "error") {
        const retriedGid = await retryTask(task);

        if (retriedGid) {
            showTaskDetailDialog.value = true;
        }

        return retriedGid;
    }

    selectedTaskGid.value = task.gid;
    showAddModDialog.value = false;
    showTaskDetailDialog.value = true;
    ElMessage.info(`已定位到现有任务：${getTaskDisplayName(task)}`);
    return task.gid;
}

async function addResourceTask(
    resource: IResource,
): Promise<IAddResourceTaskResult> {
    if (!selectedMod.value) {
        return {
            handled: false,
            gid: null,
        };
    }

    const duplicateTasks = findResourceDuplicateTasks(resource);

    if (duplicateTasks.length > 0) {
        const decision = await promptDuplicateDecision({
            title: "发现重复下载任务",
            description: `${selectedMod.value.mods_title} 已经存在相同下载记录。`,
            note: "继续会优先沿用当前最接近的任务；覆盖会删除现有记录后重新下载；同时存在会自动改一个新文件名。",
            items: duplicateTasks.map((item) => ({
                title: item.meta.modTitle || getTaskDisplayName(item.task),
                description:
                    item.task.errorMessage ||
                    `保存到 ${item.task.dir || resolvedDownloadDirectory.value || "当前下载目录"}`,
                badges: getDuplicateDialogItemBadges(item.task, item.meta),
            })),
            actions: [
                {
                    value: "cancel",
                    label: "取消",
                    description: "保留现状，不再添加新任务。",
                    variant: "outline",
                },
                {
                    value: "continue",
                    label: "继续",
                    description: "优先复用或恢复现有任务。",
                },
                {
                    value: "overwrite",
                    label: "覆盖",
                    description: "移除现有任务，按原文件名重新下载。",
                    variant: "destructive",
                },
                {
                    value: "keep-both",
                    label: "同时存在",
                    description: "自动改名后另存一份。",
                    variant: "outline",
                },
            ],
        });

        if (decision === "cancel") {
            ElMessage.info("已取消重复下载。");
            return {
                handled: true,
                gid: null,
            };
        }

        if (decision === "continue") {
            return {
                handled: true,
                gid: await continueExistingTask(duplicateTasks[0].task),
            };
        }

        if (decision === "overwrite") {
            for (const item of duplicateTasks) {
                await removeTask(item.task);
            }

            const gid = await createResourceTask(
                resource,
                buildOutputFileName(resource),
            );

            return {
                handled: gid !== null,
                gid,
            };
        }

        const gid = await createResourceTask(
            resource,
            buildUniqueGlossFileName(
                buildOutputFileName(resource),
                getAllDuplicateTaskFileNames(resource),
            ),
        );

        return {
            handled: gid !== null,
            gid,
        };
    }

    const gid = await createResourceTask(
        resource,
        buildOutputFileName(resource),
    );

    return {
        handled: gid !== null,
        gid,
    };
}

async function retryTask(task: IAria2RpcTask) {
    startTaskOperation(task.gid);

    try {
        const uris = getTaskRetryUris(task);

        if (!uris.length) {
            throw new Error("当前任务没有可重试的下载地址。");
        }

        const outputDirectory = task.dir || (await ensureRpcReady());
        const settings = normalizedAria2Settings.value;
        const trimmedProxy = (downloadProxy.value ?? "").trim();
        const metadata = taskMetaMap.value[task.gid] ?? null;
        const options: Record<string, string> = {
            dir: outputDirectory,
            out: getTaskOutputFileName(task),
            continue: "true",
            "allow-overwrite": "true",
            split: String(settings.split),
            "max-connection-per-server": String(
                settings.maxConnectionPerServer,
            ),
            "min-split-size": settings.minSplitSize,
            referer:
                metadata?.sourceUrl ||
                (metadata?.modId
                    ? `${GLOSS_MOD_WEB_BASE_URL}/mod/${metadata.modId}`
                    : `${GLOSS_MOD_WEB_BASE_URL}`),
            "user-agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        };

        if (trimmedProxy) {
            options["all-proxy"] = trimmedProxy;
        }

        const gid = await Aria2Rpc.addUri(uris, options);
        const now = new Date().toISOString();

        setTaskMeta(gid, {
            ...(metadata ?? {}),
            fileName: getTaskOutputFileName(task),
            downloadUrl: metadata?.downloadUrl || uris[0],
            createdAt: now,
            updatedAt: now,
        });

        await refreshTaskLists();
        selectedTaskGid.value = gid;
        ElMessage.success(`已重新加入下载队列：${getTaskDisplayName(task)}`);
        return gid;
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error));
        return null;
    } finally {
        finishTaskOperation(task.gid);
    }
}

function startTaskImport(gid: string) {
    if (taskImportingIds.value.includes(gid)) {
        return;
    }

    taskImportingIds.value = [...taskImportingIds.value, gid];
}

function finishTaskImport(gid: string) {
    taskImportingIds.value = taskImportingIds.value.filter(
        (item) => item !== gid,
    );
}

function isTaskImporting(gid: string) {
    return taskImportingIds.value.includes(gid);
}

async function importTaskToLocalManager(task?: IAria2RpcTask | null) {
    const targetTask = task ?? selectedTask.value;

    if (!targetTask) {
        return;
    }

    if (targetTask.status !== "complete") {
        ElMessage.warning("请先等待任务下载完成。");
        return;
    }

    startTaskImport(targetTask.gid);

    try {
        await manager.refreshRuntimeData({
            storagePath: storagePath.value,
            closeSoftLinks: disableSymlinkInstall.value,
        });

        if (!manager.managerGame || !manager.managerRoot) {
            throw new Error("请先选择游戏并配置储存路径。");
        }

        const primaryFile = getTaskPrimaryFile(targetTask);

        if (!primaryFile?.path) {
            throw new Error("当前任务没有可导入的文件。");
        }

        if (!(await FileHandler.fileExists(primaryFile.path))) {
            throw new Error("下载文件不存在，请先检查输出目录。");
        }

        const metadata = taskMetaMap.value[targetTask.gid] ?? null;
        const importMetadata = {
            modName:
                metadata?.modTitle ||
                metadata?.resourceName ||
                getTaskDisplayName(targetTask),
            fileName: metadata?.fileName || getBaseName(primaryFile.path),
            modVersion: metadata?.version || "1.0.0",
            modAuthor: metadata?.author || "",
            modWebsite: metadata?.sourceUrl || "",
            modDesc: metadata?.content || "",
            cover: metadata?.cover,
            from: getTaskSourceType(metadata),
            webId: getTaskExternalId(metadata),
            gameID: manager.managerGame.GlossGameId,
            other: {
                downloadTaskGid: targetTask.gid,
                sourceUrl: metadata?.sourceUrl || "",
            },
        };
        const importSource: ILocalModImportSource = {
            path: primaryFile.path,
            sourceType: await resolveGlossDownloadImportSourceType(
                primaryFile.path,
                metadata,
            ),
            metadata: importMetadata,
        };
        const duplicateLocalMods = findGlossDuplicateLocalMods(
            manager.managerModList,
            {
                sourceType: getTaskSourceType(metadata),
                externalId: getTaskExternalId(metadata),
                modId: metadata?.modId,
                fileName: importMetadata.fileName,
                modTitle: importMetadata.modName,
            },
        ).sort((left, right) => {
            if (
                metadata?.localModId &&
                Number(left.mod.id) === Number(metadata.localModId)
            ) {
                return -1;
            }

            if (
                metadata?.localModId &&
                Number(right.mod.id) === Number(metadata.localModId)
            ) {
                return 1;
            }

            return right.score - left.score;
        });

        if (duplicateLocalMods.length > 0) {
            const targetLocalMod = duplicateLocalMods[0].mod;
            const decision = await promptDuplicateDecision({
                title: "发现重复的本地 Mod",
                description: `${importMetadata.modName} 已经存在于本地管理器中。`,
                note: `继续会保留当前本地条目 #${targetLocalMod.id}；覆盖会替换该条目的文件；同时存在会新建一个本地条目。`,
                items: duplicateLocalMods.map((item) => ({
                    title: `${item.mod.modName} #${item.mod.id}`,
                    description:
                        item.mod.modDesc ||
                        item.mod.fileName ||
                        "已有本地 Mod 记录",
                    badges: [
                        item.reason,
                        item.mod.modVersion || "未知版本",
                        item.mod.fileName,
                    ].filter(Boolean),
                })),
                actions: [
                    {
                        value: "cancel",
                        label: "取消",
                        description: "保持当前本地管理器不变。",
                        variant: "outline",
                    },
                    {
                        value: "continue",
                        label: "继续",
                        description: "沿用当前最接近的本地条目。",
                    },
                    {
                        value: "overwrite",
                        label: "覆盖",
                        description: "用新下载的内容替换现有本地条目。",
                        variant: "destructive",
                    },
                    {
                        value: "keep-both",
                        label: "同时存在",
                        description: "保留旧条目，同时新增一个本地条目。",
                        variant: "outline",
                    },
                ],
            });

            if (decision === "cancel") {
                ElMessage.info("已取消重复导入。");
                return;
            }

            if (decision === "continue") {
                setTaskMeta(targetTask.gid, {
                    ...(metadata ?? {}),
                    localModId: targetLocalMod.id,
                    importedAt: new Date().toISOString(),
                });
                ElMessage.success(
                    `已保留现有本地 Mod：${targetLocalMod.modName}`,
                );
                return;
            }

            if (decision === "overwrite") {
                importSource.duplicateStrategy = "overwrite";
                importSource.targetMod = targetLocalMod;
            }
        }

        const result = await importLocalModSources(manager, [importSource]);
        const importedMod = result.importedMods[0];

        if (!importedMod) {
            throw new Error("没有导入任何 Mod，请检查下载文件内容。");
        }

        setTaskMeta(targetTask.gid, {
            ...(metadata ?? {}),
            localModId: importedMod.id,
            importedAt: new Date().toISOString(),
        });
        ElMessage.success(`已导入到本地管理器：${importedMod.modName}`);
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error));
    } finally {
        finishTaskImport(targetTask.gid);
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

async function removeTaskLocalFile(task: IAria2RpcTask) {
    const primaryFile = getTaskPrimaryFile(task);

    if (!primaryFile?.path) {
        return;
    }

    const deleted = await FileHandler.deleteFile(primaryFile.path);

    if (!deleted) {
        throw new Error(`删除本地文件失败：${getTaskDisplayName(task)}`);
    }
}

async function removeTaskDownloadRecord(gid: string) {
    let lastError: unknown = null;

    for (let index = 0; index < 6; index += 1) {
        try {
            await Aria2Rpc.removeDownloadResult(gid);
            return;
        } catch (error: unknown) {
            lastError = error;
            await new Promise((resolve) => globalThis.setTimeout(resolve, 250));
        }
    }

    throw lastError ?? new Error("清理下载记录失败，请稍后重试。");
}

async function removeTask(task: IAria2RpcTask) {
    startTaskOperation(task.gid);

    try {
        if (["active", "waiting", "paused"].includes(task.status)) {
            await Aria2Rpc.remove(task.gid, true);
            await waitForRemovedTask(task.gid);
        }

        await removeTaskLocalFile(task);
        await removeTaskDownloadRecord(task.gid);
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
    if (stoppedTasks.value.length === 0) {
        ElMessage.info("当前没有可清理的历史任务。");
        return;
    }

    try {
        const nextMap = { ...taskMetaMap.value };
        const failedMessages: string[] = [];
        let removedCount = 0;

        for (const task of stoppedTasks.value) {
            try {
                await removeTaskLocalFile(task);
                await removeTaskDownloadRecord(task.gid);
                delete nextMap[task.gid];
                removedCount += 1;
            } catch (error: unknown) {
                failedMessages.push(
                    `${getTaskDisplayName(task)}：${getErrorMessage(error)}`,
                );
            }
        }

        taskMetaMap.value = nextMap;
        await refreshTaskLists();

        if (failedMessages.length > 0) {
            ElMessage.warning(
                `已清理 ${removedCount} 条历史任务，另有 ${failedMessages.length} 条处理失败：${failedMessages
                    .slice(0, 2)
                    .join("；")}${failedMessages.length > 2 ? "……" : ""}`,
            );
            return;
        }

        ElMessage.success(
            `已清理 ${removedCount} 条历史任务，并删除对应本地文件。`,
        );
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
    const relatedSourceType = taskMetaMap.value[targetTask.gid]?.sourceType;

    if (!relatedModId || relatedSourceType !== "GlossMod") {
        ElMessage.warning("当前任务没有关联的 Mod 详情。");
        return;
    }

    showTaskDetailDialog.value = false;
    showAddModDialog.value = true;
    modLookupInput.value = String(relatedModId);
    await loadModDetail(String(relatedModId));
}
</script>
<template>
    <div class="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <div
                    class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"
                >
                    <div class="space-y-2">
                        <CardTitle class="flex flex-wrap items-center gap-3">
                            <h1 class="text-2xl">下载中心</h1>
                        </CardTitle>
                    </div>
                    <Badge
                        class="rounded-full"
                        :class="
                            getTaskStatusClass(
                                rpcState === 'ready'
                                    ? 'active'
                                    : rpcState === 'error'
                                      ? 'error'
                                      : 'waiting',
                            )
                        "
                        variant="outline"
                    >
                        {{
                            rpcState === "ready"
                                ? "服务已连接"
                                : rpcState === "starting"
                                  ? "服务启动中"
                                  : rpcState === "error"
                                    ? "服务异常"
                                    : "等待启动"
                        }}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center gap-2">
                    <SelectGame />
                    <Button size="sm" @click="openAddModDialog">
                        <IconPlus />
                        添加 Mod
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        @click="openAria2SettingsDialog"
                    >
                        <IconSettings2 />
                        Aria2 设置
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        @click="restartAria2Service()"
                    >
                        <IconRefreshCw />
                        重启 Aria2
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        @click="selectDownloadDirectory"
                    >
                        <IconFolderSearch />
                        选择下载目录
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        @click="openDownloadDirectory"
                    >
                        <IconFolderOpen />
                        打开目录
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        :disabled="refreshingTasks"
                        @click="refreshTaskLists()"
                    >
                        <IconRefreshCw
                            :class="refreshingTasks ? 'animate-spin' : ''"
                        />
                        刷新任务
                    </Button>
                </div>

                <div
                    v-if="rpcErrorMessage"
                    class="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                    {{ rpcErrorMessage }}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle
                    class="flex flex-wrap items-center justify-between gap-3"
                >
                    <span
                        >下载任务列表
                        <Badge variant="outline" class="rounded-full ml-4">
                            {{ formatSpeed(globalStat.downloadSpeed) }}
                        </Badge>
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        @click="purgeStoppedTasks"
                    >
                        <IconTrash2 />
                        清理记录和文件
                    </Button>
                </CardTitle>
                <CardDescription>
                    列表用于管理下载队列，详情改为弹窗查看。
                </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
                <div class="flex flex-wrap gap-2">
                    <Button
                        v-for="item in queueFilterOptions"
                        :key="item.value"
                        size="sm"
                        :variant="
                            queueFilter === item.value ? 'default' : 'outline'
                        "
                        @click="queueFilter = item.value"
                    >
                        {{ item.label }}
                        <span class="text-xs opacity-70">{{ item.count }}</span>
                    </Button>
                </div>

                <div
                    v-if="filteredTasks.length"
                    class="flex flex-col gap-3 rounded-xl border px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                >
                    <div class="text-sm text-muted-foreground">
                        {{ visibleTaskRangeLabel }}，已按添加时间倒序排列。
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-sm text-muted-foreground"
                            >每页数量</span
                        >
                        <Select v-model="taskPageSize">
                            <SelectTrigger class="w-[140px]">
                                <SelectValue placeholder="选择每页数量" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="item in TASK_PAGE_SIZE_OPTIONS"
                                    :key="item"
                                    :value="item"
                                >
                                    每页 {{ item }} 条
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div
                    v-if="!filteredTasks.length"
                    class="rounded-xl border border-dashed px-6 py-12 text-center"
                >
                    <div class="text-base font-medium">当前没有任务</div>
                    <p class="mt-2 text-sm leading-6 text-muted-foreground">
                        通过顶部“添加
                        Mod”弹窗读取资源后，下载任务会直接出现在这里。
                    </p>
                </div>

                <div v-else class="space-y-3">
                    <article
                        v-for="task in paginatedTasks"
                        :key="task.gid"
                        class="cursor-pointer rounded-xl border px-4 py-4 transition-colors hover:border-primary/40"
                        :class="
                            selectedTaskGid === task.gid
                                ? 'border-primary/50 bg-primary/5'
                                : ''
                        "
                        @click="openTaskDetail(task)"
                    >
                        <div
                            class="flex gap-3 flex-row items-center justify-between"
                        >
                            <div class="min-w-0 flex-1 space-y-2">
                                <div class="flex flex-wrap items-center gap-2">
                                    <div
                                        v-if="taskMetaMap[task.gid]?.modTitle"
                                        class="truncate text-sm font-medium"
                                    >
                                        {{ taskMetaMap[task.gid]?.modTitle }}
                                    </div>
                                    <Badge
                                        class="rounded-full"
                                        :class="getTaskStatusClass(task.status)"
                                        variant="outline"
                                    >
                                        {{ getTaskStatusLabel(task.status) }}
                                    </Badge>
                                    <Badge
                                        class="rounded-full"
                                        variant="outline"
                                    >
                                        {{ getTaskDisplayName(task) }}
                                    </Badge>
                                    <!-- <Badge v-if="taskMetaMap[task.gid]?.localModId" class="rounded-full"
                                        variant="secondary">
                                        已导入本地
                                    </Badge> -->
                                </div>

                                <div
                                    class="h-2 overflow-hidden rounded-full bg-muted"
                                >
                                    <div
                                        class="h-full rounded-full bg-primary transition-all"
                                        :style="{
                                            width: `${getTaskProgress(task)}%`,
                                        }"
                                    ></div>
                                </div>

                                <div
                                    class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
                                >
                                    <span
                                        >{{ formatBytes(task.completedLength) }}
                                        /
                                        {{
                                            formatBytes(task.totalLength)
                                        }}</span
                                    >
                                    <span
                                        >速度：{{
                                            formatSpeed(task.downloadSpeed)
                                        }}</span
                                    >
                                    <span
                                        >连接：{{
                                            formatNumber(task.connections)
                                        }}</span
                                    >
                                    <span v-if="task.errorMessage"
                                        >错误：{{ task.errorMessage }}</span
                                    >
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-2" @click.stop>
                                <Button
                                    v-if="task.status === 'complete'"
                                    size="sm"
                                    variant="outline"
                                    :disabled="
                                        !canImportToLocalManager ||
                                        isTaskImporting(task.gid)
                                    "
                                    @click="importTaskToLocalManager(task)"
                                >
                                    <IconFileUp />
                                    {{
                                        isTaskImporting(task.gid)
                                            ? "导入中"
                                            : taskMetaMap[task.gid]?.localModId
                                              ? "重新导入"
                                              : "一键导入"
                                    }}
                                </Button>
                                <Button
                                    v-if="task.status === 'error'"
                                    size="sm"
                                    variant="outline"
                                    :disabled="isTaskOperating(task.gid)"
                                    @click="retryTask(task)"
                                >
                                    <IconRefreshCw />
                                    重试
                                </Button>
                                <Button
                                    v-if="
                                        task.status === 'active' ||
                                        task.status === 'waiting'
                                    "
                                    size="sm"
                                    variant="outline"
                                    :disabled="isTaskOperating(task.gid)"
                                    @click="pauseTask(task)"
                                >
                                    <IconPause />
                                    暂停
                                </Button>
                                <Button
                                    v-else-if="task.status === 'paused'"
                                    size="sm"
                                    variant="outline"
                                    :disabled="isTaskOperating(task.gid)"
                                    @click="resumeTask(task)"
                                >
                                    <IconPlay />
                                    继续
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    :disabled="isTaskOperating(task.gid)"
                                    @click="removeTask(task)"
                                >
                                    <IconTrash2 />
                                    删除
                                </Button>
                            </div>
                        </div>
                    </article>

                    <div
                        v-if="taskTotalPages > 1"
                        class="flex flex-col gap-4 rounded-xl border px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                        <div class="text-sm text-muted-foreground">
                            当前第 {{ taskPage }} 页，共
                            {{ taskTotalPages }} 页， 累计
                            {{ filteredTaskCount }} 条任务。
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="taskPage <= 1"
                                @click="goToTaskPage(taskPage - 1)"
                            >
                                <IconChevronLeft />
                                上一页
                            </Button>

                            <template
                                v-for="item in taskPaginationItems"
                                :key="item.key"
                            >
                                <span
                                    v-if="item.ellipsis"
                                    class="px-2 text-sm text-muted-foreground"
                                >
                                    {{ item.label }}
                                </span>
                                <Button
                                    v-else
                                    size="sm"
                                    :variant="
                                        item.page === taskPage
                                            ? 'default'
                                            : 'outline'
                                    "
                                    @click="goToTaskPage(item.page ?? 1)"
                                >
                                    {{ item.label }}
                                </Button>
                            </template>

                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="taskPage >= taskTotalPages"
                                @click="goToTaskPage(taskPage + 1)"
                            >
                                下一页
                                <IconChevronRight />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Dialog v-model:open="showAddModDialog" modal>
            <DialogScrollContent class="sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>添加 Mod</DialogTitle>
                    <DialogDescription>
                        输入 3DM Mod ID
                        或详情链接后，直接在弹窗里查看详情并添加到 aria2 队列。
                    </DialogDescription>
                </DialogHeader>

                <div class="flex gap-2">
                    <Input
                        v-model="modLookupInput"
                        placeholder="例如：252329 或 https://mod.3dmgame.com/mod/252329"
                        @keydown.enter="loadModDetail()"
                    />
                    <Button
                        :disabled="modLookupLoading"
                        @click="loadModDetail()"
                    >
                        <IconSearch />
                        读取详情
                    </Button>
                </div>

                <div
                    v-if="modLookupError"
                    class="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive"
                >
                    {{ modLookupError }}
                </div>

                <div
                    v-if="modLookupLoading"
                    class="space-y-3 rounded-xl border p-4"
                >
                    <div
                        class="aspect-video animate-pulse rounded-xl bg-muted"
                    ></div>
                    <div class="h-6 w-2/3 animate-pulse rounded bg-muted"></div>
                    <div
                        class="h-4 w-full animate-pulse rounded bg-muted"
                    ></div>
                    <div class="h-4 w-5/6 animate-pulse rounded bg-muted"></div>
                </div>

                <div
                    v-else-if="!selectedMod"
                    class="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center"
                >
                    <IconDownload class="size-8 text-muted-foreground" />
                    <div class="mt-3 text-base font-medium">
                        等待载入 Mod 详情
                    </div>
                    <p
                        class="mt-2 max-w-sm text-sm leading-6 text-muted-foreground"
                    >
                        读取成功后，这里会显示 Mod 简介、资源列表和下载按钮。
                    </p>
                </div>

                <div
                    v-else
                    class="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
                >
                    <div class="space-y-4">
                        <div class="overflow-hidden rounded-xl border">
                            <img
                                :src="
                                    resolveGlossAssetUrl(
                                        selectedMod.mods_image_url,
                                    )
                                "
                                :alt="selectedMod.mods_title"
                                class="aspect-video w-full object-cover"
                                @error="
                                    (event) =>
                                        ((
                                            event.target as HTMLImageElement
                                        ).src = EMPTY_POSTER)
                                "
                            />
                        </div>

                        <div class="space-y-3 rounded-xl border px-4 py-4">
                            <div>
                                <h2 class="text-xl font-semibold leading-8">
                                    {{ selectedMod.mods_title }}
                                </h2>
                                <p class="mt-1 text-sm text-muted-foreground">
                                    {{ selectedMod.game_name }} ·
                                    {{
                                        (
                                            selectedMod.mods_type_name || ""
                                        ).trim() || "未分类"
                                    }}
                                </p>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <Badge class="rounded-full" variant="outline">
                                    作者：{{
                                        selectedMod.user_nickName ||
                                        selectedMod.mods_author ||
                                        "未知"
                                    }}
                                </Badge>
                                <Badge class="rounded-full" variant="outline">
                                    版本：{{
                                        selectedMod.mods_version || "未知"
                                    }}
                                </Badge>
                                <Badge class="rounded-full" variant="outline">
                                    更新时间：{{
                                        formatDate(selectedMod.mods_updateTime)
                                    }}
                                </Badge>
                                <Badge
                                    v-if="selectedMod.support_gmm"
                                    class="rounded-full"
                                    variant="secondary"
                                >
                                    支持 GMM
                                </Badge>
                            </div>

                            <div
                                class="grid grid-cols-3 gap-3 text-center text-xs"
                            >
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">
                                        下载
                                    </div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{
                                            formatNumber(
                                                selectedMod.mods_download_cnt,
                                            )
                                        }}
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">
                                        浏览
                                    </div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{
                                            formatNumber(
                                                selectedMod.mods_click_cnt,
                                            )
                                        }}
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">
                                        收藏
                                    </div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{
                                            formatNumber(
                                                selectedMod.mods_mark_cnt,
                                            )
                                        }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div
                            class="rounded-xl border px-4 py-4 text-sm leading-7 text-muted-foreground"
                        >
                            <p
                                v-if="selectedMod.mods_desc"
                                class="whitespace-pre-wrap"
                            >
                                {{ selectedMod.mods_desc }}
                            </p>
                            <div
                                v-if="detailParagraphs.length"
                                class="mt-3 space-y-2"
                            >
                                <p
                                    v-for="(item, index) in detailParagraphs"
                                    :key="`${selectedMod.id}-paragraph-${index}`"
                                    class="rounded-lg bg-muted/35 px-3 py-2 text-foreground"
                                >
                                    {{ item }}
                                </p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="text-sm font-medium">资源列表</div>
                                <div class="text-xs text-muted-foreground">
                                    共
                                    {{ selectedMod.mods_resource.length }}
                                    个资源
                                </div>
                            </div>

                            <div
                                class="max-h-[48vh] space-y-3 overflow-y-auto pr-1"
                            >
                                <div
                                    v-for="resource in selectedMod.mods_resource"
                                    :key="`${selectedMod.id}-${resource.id}`"
                                    class="rounded-xl border px-4 py-4"
                                >
                                    <div
                                        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
                                    >
                                        <div class="space-y-2">
                                            <div
                                                class="flex flex-wrap items-center gap-2"
                                            >
                                                <div
                                                    class="text-sm font-medium"
                                                >
                                                    {{
                                                        resource.mods_resource_name
                                                    }}
                                                </div>
                                                <Badge
                                                    v-if="
                                                        resource.mods_resource_latest_version
                                                    "
                                                    class="rounded-full"
                                                    variant="secondary"
                                                >
                                                    最新
                                                </Badge>
                                            </div>
                                            <div
                                                class="flex flex-wrap gap-2 text-xs text-muted-foreground"
                                            >
                                                <span
                                                    >大小：{{
                                                        resource.mods_resource_size ||
                                                        "未知"
                                                    }}</span
                                                >
                                                <span>·</span>
                                                <span
                                                    >版本：{{
                                                        resource.mods_resource_version ||
                                                        selectedMod.mods_version ||
                                                        "未知"
                                                    }}</span
                                                >
                                                <span
                                                    v-if="
                                                        resource.mods_resource_formart
                                                    "
                                                    >·</span
                                                >
                                                <span
                                                    v-if="
                                                        resource.mods_resource_formart
                                                    "
                                                    >格式：{{
                                                        resource.mods_resource_formart
                                                    }}</span
                                                >
                                            </div>
                                            <div
                                                v-if="
                                                    getResourcePresence(
                                                        resource,
                                                    ).state !== 'none'
                                                "
                                                class="flex flex-wrap gap-2 text-xs"
                                            >
                                                <Badge
                                                    class="rounded-full"
                                                    variant="outline"
                                                >
                                                    {{
                                                        getResourcePresence(
                                                            resource,
                                                        ).label
                                                    }}
                                                </Badge>
                                                <Badge
                                                    v-if="
                                                        getResourcePresence(
                                                            resource,
                                                        ).localCount > 0
                                                    "
                                                    class="rounded-full"
                                                    variant="secondary"
                                                >
                                                    已在本地管理器
                                                </Badge>
                                            </div>
                                            <p
                                                v-if="
                                                    resource.mods_resource_desc
                                                "
                                                class="text-sm text-muted-foreground"
                                            >
                                                {{
                                                    resource.mods_resource_desc
                                                }}
                                            </p>
                                        </div>

                                        <Button
                                            size="sm"
                                            :disabled="
                                                addingResourceKey ===
                                                `${selectedMod.id}-${resource.id ?? resource.mods_resource_name}`
                                            "
                                            @click="addResourceTask(resource)"
                                        >
                                            <IconPlus />
                                            {{
                                                addingResourceKey ===
                                                `${selectedMod.id}-${
                                                    resource.id ??
                                                    resource.mods_resource_name
                                                }`
                                                    ? "添加中"
                                                    : getResourceActionLabel(
                                                          resource,
                                                      )
                                            }}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogScrollContent>
        </Dialog>

        <Dialog v-model:open="showAria2SettingsDialog" modal>
            <DialogContent class="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Aria2 设置</DialogTitle>
                    <DialogDescription>
                        修改后会立即重启 aria2 服务，并对后续任务生效。
                    </DialogDescription>
                </DialogHeader>

                <div class="grid gap-4 sm:grid-cols-2">
                    <div
                        class="flex items-center justify-between rounded-xl border px-4 py-3 sm:col-span-2"
                    >
                        <div>
                            <div class="text-sm font-medium">
                                启动时自动启动 Aria2
                            </div>
                            <div class="mt-1 text-xs text-muted-foreground">
                                开启后，程序启动时会自动拉起 aria2 RPC 服务。
                            </div>
                        </div>
                        <Switch v-model="aria2SettingsDraft.autoStart" />
                    </div>

                    <div class="grid gap-2">
                        <Label for="aria2-rpc-port">RPC 端口</Label>
                        <Input
                            id="aria2-rpc-port"
                            v-model.number="aria2SettingsDraft.rpcPort"
                            type="number"
                            min="1"
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="aria2-rpc-secret">RPC 密钥</Label>
                        <Input
                            id="aria2-rpc-secret"
                            v-model="aria2SettingsDraft.rpcSecret"
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="aria2-max-concurrent">最大并发任务</Label>
                        <Input
                            id="aria2-max-concurrent"
                            v-model.number="
                                aria2SettingsDraft.maxConcurrentDownloads
                            "
                            type="number"
                            min="5"
                            max="5"
                            disabled
                        />
                        <div class="text-xs text-muted-foreground">
                            为降低源站返回 503 的概率，同时下载任务已固定为 5。
                        </div>
                    </div>

                    <div class="grid gap-2">
                        <Label for="aria2-split">单任务分片数</Label>
                        <Input
                            id="aria2-split"
                            v-model.number="aria2SettingsDraft.split"
                            type="number"
                            min="1"
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="aria2-max-connection">单服务器连接数</Label>
                        <Input
                            id="aria2-max-connection"
                            v-model.number="
                                aria2SettingsDraft.maxConnectionPerServer
                            "
                            type="number"
                            min="1"
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="aria2-min-split-size">最小分片大小</Label>
                        <Input
                            id="aria2-min-split-size"
                            v-model="aria2SettingsDraft.minSplitSize"
                            placeholder="例如 1M"
                        />
                    </div>

                    <div class="grid gap-2 sm:col-span-2">
                        <Label for="aria2-download-proxy">下载代理</Label>
                        <Input
                            id="aria2-download-proxy"
                            v-model="downloadProxyDraft"
                            placeholder="例如 http://127.0.0.1:7890，可留空"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        @click="showAria2SettingsDialog = false"
                    >
                        取消
                    </Button>
                    <Button @click="saveAria2Settings"> 保存并重启 </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog v-model:open="duplicateDialog.open" modal>
            <DialogContent class="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{{ duplicateDialog.title }}</DialogTitle>
                    <DialogDescription>
                        {{ duplicateDialog.description }}
                    </DialogDescription>
                </DialogHeader>

                <div class="space-y-4">
                    <div
                        v-if="duplicateDialog.note"
                        class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
                    >
                        {{ duplicateDialog.note }}
                    </div>

                    <div class="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
                        <div
                            v-for="(item, index) in duplicateDialog.items"
                            :key="`${duplicateDialog.title}-${index}`"
                            class="rounded-xl border px-4 py-3"
                        >
                            <div class="flex flex-wrap items-center gap-2">
                                <div class="text-sm font-medium">
                                    {{ item.title }}
                                </div>
                                <Badge
                                    v-for="badge in item.badges"
                                    :key="`${item.title}-${badge}`"
                                    class="rounded-full"
                                    variant="outline"
                                >
                                    {{ badge }}
                                </Badge>
                            </div>
                            <p
                                class="mt-2 text-sm leading-6 text-muted-foreground"
                            >
                                {{ item.description }}
                            </p>
                        </div>
                    </div>

                    <div class="grid gap-2 sm:grid-cols-2">
                        <Button
                            v-for="option in duplicateDialog.options"
                            :key="option.value"
                            :variant="option.variant ?? 'default'"
                            class="h-auto items-start justify-start px-4 py-3 text-left"
                            @click="resolveDuplicateDialog(option.value)"
                        >
                            <div>
                                <div class="text-sm font-medium">
                                    {{ option.label }}
                                </div>
                                <div class="mt-1 text-xs text-muted-foreground">
                                    {{ option.description }}
                                </div>
                            </div>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog v-model:open="showTaskDetailDialog" modal>
            <DialogScrollContent class="sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>任务详情</DialogTitle>
                    <DialogDescription>
                        查看当前任务的进度、文件和关联 Mod 信息。
                    </DialogDescription>
                </DialogHeader>

                <div
                    v-if="selectedTask"
                    class="grid gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]"
                >
                    <div class="space-y-4">
                        <div
                            class="overflow-hidden rounded-xl border bg-muted/30"
                        >
                            <img
                                :src="selectedTaskMeta?.cover || EMPTY_POSTER"
                                :alt="getTaskDisplayName(selectedTask)"
                                class="aspect-video w-full object-cover"
                                @error="
                                    (event) =>
                                        ((
                                            event.target as HTMLImageElement
                                        ).src = EMPTY_POSTER)
                                "
                            />
                        </div>

                        <div class="space-y-3 rounded-xl border px-4 py-4">
                            <div
                                class="flex flex-wrap items-start justify-between gap-3"
                            >
                                <div>
                                    <div
                                        class="text-lg font-semibold leading-7"
                                    >
                                        {{ getTaskDisplayName(selectedTask) }}
                                    </div>
                                    <div
                                        class="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground"
                                    >
                                        <span>GID：{{ selectedTask.gid }}</span>
                                        <span>·</span>
                                        <span>{{
                                            getTaskStatusLabel(
                                                selectedTask.status,
                                            )
                                        }}</span>
                                    </div>
                                </div>
                                <Badge
                                    class="rounded-full"
                                    :class="
                                        getTaskStatusClass(selectedTask.status)
                                    "
                                    variant="outline"
                                >
                                    {{
                                        getTaskStatusLabel(selectedTask.status)
                                    }}
                                </Badge>
                            </div>

                            <div
                                class="grid grid-cols-2 gap-3 text-center text-xs"
                            >
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">
                                        进度
                                    </div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{ getTaskProgress(selectedTask) }}%
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">
                                        速度
                                    </div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{
                                            formatSpeed(
                                                selectedTask.downloadSpeed,
                                            )
                                        }}
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">
                                        已下载
                                    </div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{
                                            formatBytes(
                                                selectedTask.completedLength,
                                            )
                                        }}
                                    </div>
                                </div>
                                <div class="rounded-xl bg-muted/40 px-3 py-3">
                                    <div class="text-muted-foreground">
                                        总大小
                                    </div>
                                    <div class="mt-1 text-base font-semibold">
                                        {{
                                            formatBytes(
                                                selectedTask.totalLength,
                                            )
                                        }}
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    @click="openTaskFolder(selectedTask)"
                                >
                                    <IconFolderOpen />
                                    打开目录
                                </Button>
                                <Button
                                    v-if="selectedTask.status === 'error'"
                                    size="sm"
                                    variant="outline"
                                    :disabled="
                                        isTaskOperating(selectedTask.gid)
                                    "
                                    @click="retryTask(selectedTask)"
                                >
                                    <IconRefreshCw />
                                    重试下载
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    :disabled="
                                        selectedTask.status !== 'complete'
                                    "
                                    @click="openTaskFile(selectedTask)"
                                >
                                    <IconFileUp />
                                    打开文件
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    :disabled="
                                        selectedTask.status !== 'complete' ||
                                        !canImportToLocalManager ||
                                        isTaskImporting(selectedTask.gid)
                                    "
                                    @click="
                                        importTaskToLocalManager(selectedTask)
                                    "
                                >
                                    <IconFileUp />
                                    {{
                                        isTaskImporting(selectedTask.gid)
                                            ? "导入中"
                                            : selectedTaskMeta?.localModId
                                              ? "重新导入本地"
                                              : "导入到本地管理器"
                                    }}
                                </Button>
                                <Button
                                    v-if="
                                        selectedTaskMeta?.sourceType ===
                                            'GlossMod' &&
                                        selectedTaskMeta?.modId
                                    "
                                    size="sm"
                                    variant="outline"
                                    @click="loadRelatedModDetail(selectedTask)"
                                >
                                    <IconPanelRightOpen />
                                    查看关联 Mod
                                </Button>
                            </div>

                            <div
                                v-if="selectedTask.errorMessage"
                                class="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                            >
                                {{ selectedTask.errorMessage }}
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="rounded-xl border px-4 py-3 text-sm">
                            <div class="text-xs text-muted-foreground">
                                保存目录
                            </div>
                            <div class="mt-1 break-all leading-6">
                                {{ selectedTask.dir || "未知目录" }}
                            </div>
                        </div>

                        <div
                            v-if="selectedTaskMeta"
                            class="rounded-xl border px-4 py-3 text-sm"
                        >
                            <div class="text-xs text-muted-foreground">
                                关联 Mod
                            </div>
                            <div class="mt-1 font-medium">
                                {{ selectedTaskMeta.modTitle || "未知 Mod" }}
                            </div>
                            <div
                                class="mt-1 text-xs text-muted-foreground leading-6"
                            >
                                {{ selectedTaskMeta.gameName || "未记录游戏" }}
                                <span v-if="selectedTaskMeta.version"
                                    >· 版本 {{ selectedTaskMeta.version }}</span
                                >
                                <span v-if="selectedTaskMeta.localModId"
                                    >· 已导入本地 #{{
                                        selectedTaskMeta.localModId
                                    }}</span
                                >
                            </div>
                            <p
                                v-if="selectedTaskMeta.content"
                                class="mt-3 line-clamp-6 text-sm text-muted-foreground"
                            >
                                {{ selectedTaskMeta.content }}
                            </p>
                        </div>

                        <div class="space-y-3">
                            <div class="text-sm font-medium">文件列表</div>
                            <div
                                class="max-h-[48vh] space-y-2 overflow-y-auto pr-1"
                            >
                                <div
                                    v-for="(file, index) in selectedTask.files"
                                    :key="`${selectedTask.gid}-${index}`"
                                    class="rounded-xl border px-3 py-3 text-sm"
                                >
                                    <div class="font-medium">
                                        {{
                                            getBaseName(file.path) ||
                                            `文件 ${index + 1}`
                                        }}
                                    </div>
                                    <div
                                        class="mt-1 text-xs text-muted-foreground"
                                    >
                                        {{ formatBytes(file.completedLength) }}
                                        / {{ formatBytes(file.length) }}
                                    </div>
                                    <div
                                        class="mt-2 break-all text-xs text-muted-foreground"
                                    >
                                        {{ file.path || "暂无文件路径" }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    v-else
                    class="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center"
                >
                    <IconListChecks class="size-8 text-muted-foreground" />
                    <div class="mt-3 text-base font-medium">先选择一个任务</div>
                    <p
                        class="mt-2 max-w-sm text-sm leading-6 text-muted-foreground"
                    >
                        关闭弹窗后从下载列表重新点开任务即可查看详情。
                    </p>
                </div>
            </DialogScrollContent>
        </Dialog>
    </div>
</template>
<style scoped></style>
