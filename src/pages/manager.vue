<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";
import { ElMessage } from "element-plus-message";
import { createGmmPackage, installGmmPackage } from "@/lib/gmm-package";
import { checkGlossModUpdates } from "@/lib/gloss-mod-api";
import {
    ARCHIVE_EXTENSIONS,
    importLocalModSources,
    resolveLocalModImportSourceType,
} from "@/lib/local-mod-import";
import { syncManagerRuntimeContext } from "@/lib/manager-context";
import { queueGlossModDownload } from "@/lib/gloss-download-queue";
import ManagerPreloadList from "@/components/Manager/ManagerPreloadList.vue";
import {
    CheckCheck,
    CheckSquare,
    Download,
    FolderOpen,
    FolderPlus,
    Gamepad2,
    Package,
    RefreshCw,
    Search,
    Settings2,
    Shuffle,
    SquarePen,
    Trash2,
    Upload,
} from "lucide-vue-next";

interface IBatchEditForm {
    modAuthor: string;
    modType: number | string | "";
    modVersion: string;
    modWebsite: string;
    tagsText: string;
}

const manager = useManager();
const router = useRouter();
const { selectionMode, selectionIds } = storeToRefs(manager);

const storagePath = PersistentStore.useValue<string>("storagePath", "");
const disableSymlinkInstall = PersistentStore.useValue<boolean>(
    "disableSymlinkInstall",
    false,
);

const loading = ref(false);
const importLoading = ref(false);
const loadError = ref("");
const actioningIds = ref<number[]>([]);
const updateChecking = ref(false);
const exportLoading = ref(false);
const windowDropActive = ref(false);

const showBatchEditDialog = ref(false);
const showExportDialog = ref(false);
const batchEditForm = reactive<IBatchEditForm>({
    modAuthor: "",
    modType: "",
    modVersion: "",
    modWebsite: "",
    tagsText: "",
});
const exportForm = reactive<IInfo>({
    name: "",
    version: "1.0.0",
    description: "",
    gameID: undefined,
    author: "",
});

let latestLoadId = 0;
let unlistenWindowDragDrop: (() => void) | null = null;

watch(manager.filteredMods, (mods) => {
    void mods;
    manager.retainVisibleSelection();
});

watch(
    [manager.managerGame, storagePath, disableSymlinkInstall],
    async () => {
        await syncManagerContext();
        await loadManagerData();
    },
    { immediate: true },
);

watch(
    () => manager.managerGame?.GlossGameId,
    (gameId) => {
        exportForm.gameID = gameId;
    },
    { immediate: true },
);

function normalizeSlashes(filePath: string) {
    return filePath.replace(/\\+/gu, "/");
}

function getBaseName(filePath: string) {
    const normalized = normalizeSlashes(filePath);
    return normalized.split("/").pop() ?? filePath;
}

function getFileExtension(filePath: string) {
    const fileName = getBaseName(filePath);
    const index = fileName.lastIndexOf(".");

    if (index === -1) {
        return "";
    }

    return fileName.slice(index).toLowerCase();
}

function createTagColor(tagName: string) {
    let hash = 0;

    for (const char of tagName) {
        hash = (hash * 31 + char.charCodeAt(0)) % 360;
    }

    return `hsl(${Math.abs(hash)} 68% 46%)`;
}

function dedupeTags(list: Array<ITag | string | undefined>) {
    const tagMap = new Map<string, ITag>();

    for (const item of list) {
        if (!item) {
            continue;
        }

        if (typeof item === "string") {
            const name = item.trim();

            if (!name) {
                continue;
            }

            tagMap.set(name, {
                name,
                color: createTagColor(name),
            });
            continue;
        }

        const name = item.name.trim();

        if (!name) {
            continue;
        }

        tagMap.set(name, {
            name,
            color: item.color || createTagColor(name),
        });
    }

    return [...tagMap.values()].sort((left, right) =>
        manager.textCollator.compare(left.name, right.name),
    );
}

function collectModTags(modList: IModInfo[]) {
    return dedupeTags(modList.flatMap((mod) => mod.tags ?? []));
}

async function syncManagerContext() {
    await syncManagerRuntimeContext(manager, {
        storagePath: storagePath.value,
        closeSoftLinks: disableSymlinkInstall.value,
    });
}

async function detectModType(mod: IModInfo) {
    const game = manager.managerGame;

    if (!game) {
        return 99;
    }

    try {
        if (typeof game.checkModType === "function") {
            return await game.checkModType(mod);
        }

        for (const rule of game.checkModType) {
            const matched = mod.modFiles.some((file) => {
                const normalizedFile = normalizeSlashes(file).toLowerCase();

                return rule.Keyword.some((keyword) => {
                    const normalizedKeyword = keyword.toLowerCase();

                    if (rule.UseFunction === "inPath") {
                        return normalizedFile.includes(normalizedKeyword);
                    }

                    if (rule.UseFunction === "basename") {
                        return (
                            getBaseName(normalizedFile) === normalizedKeyword
                        );
                    }

                    return [
                        normalizedKeyword,
                        `.${normalizedKeyword}`,
                    ].includes(getFileExtension(normalizedFile));
                });
            });

            if (matched) {
                return rule.TypeId ?? 99;
            }
        }
    } catch (error: unknown) {
        console.error("识别 Mod 类型失败");
        console.error(error);
    }

    return (
        manager.availableTypes.find((item) => String(item.id) === "99")?.id ??
        manager.availableTypes[0]?.id ??
        99
    );
}

function normalizeMod(mod: Partial<IModInfo>): IModInfo {
    return {
        id: Number(mod.id ?? Date.now()),
        modName: mod.modName || mod.fileName || `Mod ${mod.id ?? ""}`,
        fileName: mod.fileName || mod.modName || `mod-${mod.id ?? Date.now()}`,
        md5: mod.md5 || "",
        modVersion: mod.modVersion || "1.0.0",
        isUpdate: Boolean(mod.isUpdate),
        isInstalled: Boolean(mod.isInstalled),
        weight: typeof mod.weight === "number" ? mod.weight : 0,
        modFiles: Array.isArray(mod.modFiles) ? mod.modFiles : [],
        tags: dedupeTags(mod.tags ?? []),
        modAuthor: mod.modAuthor ?? "",
        modWebsite: mod.modWebsite ?? "",
        modType: mod.modType ?? 99,
        modDesc: mod.modDesc ?? "",
        other: mod.other ?? {},
        from: mod.from,
        webId: mod.webId,
        cover: mod.cover,
        advanced: mod.advanced,
        key: mod.key,
    };
}

async function loadManagerData() {
    latestLoadId += 1;
    const currentLoadId = latestLoadId;
    loadError.value = "";
    selectionIds.value = [];

    if (!manager.managerGame) {
        manager.managerModList = [];
        manager.tags = [];
        return;
    }

    if (!storagePath.value || !manager.managerRoot) {
        manager.managerModList = [];
        manager.tags = [];
        return;
    }

    loading.value = true;

    try {
        const storedMods = (await Manager.getModInfo(
            manager.managerRoot,
        )) as IModInfo[];
        const storedTags = (await Manager.getModInfo(
            manager.managerRoot,
            "tags.json",
        )) as ITag[];

        const normalizedMods = await Promise.all(
            storedMods.map(async (item) => {
                const mod = normalizeMod(item);

                if (
                    item.modType === undefined ||
                    item.modType === null ||
                    item.modType === ""
                ) {
                    mod.modType = await detectModType(mod);
                }

                return mod;
            }),
        );

        if (currentLoadId !== latestLoadId) {
            return;
        }

        manager.managerModList = normalizedMods;
        manager.tags = dedupeTags([
            ...storedTags,
            ...collectModTags(normalizedMods),
        ]);

        if (
            manager.selectedType !== 0 &&
            !manager.availableTypes.some(
                (item) => String(item.id) === String(manager.selectedType),
            )
        ) {
            manager.selectedType = 0;
        }

        if (
            manager.selectedTag !== "全部" &&
            !manager.tags.some((tag) => tag.name === manager.selectedTag)
        ) {
            manager.selectedTag = "全部";
        }
    } catch (error: unknown) {
        manager.managerModList = [];
        manager.tags = [];
        loadError.value = "读取本地 Mod 数据失败，请检查储存路径权限。";
        console.error("读取管理页数据失败");
        console.error(error);
    } finally {
        if (currentLoadId === latestLoadId) {
            loading.value = false;
        }
    }
}

function syncTagsFromMods() {
    manager.tags = dedupeTags([
        ...manager.tags,
        ...collectModTags(manager.managerModList),
    ]);
}

async function applyBatchEdit() {
    const parsedTags = dedupeTags(
        batchEditForm.tagsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
    );

    manager.managerModList = manager.managerModList.map((mod) => {
        if (!selectionIds.value.includes(mod.id)) {
            return mod;
        }

        return normalizeMod({
            ...mod,
            modAuthor: batchEditForm.modAuthor || mod.modAuthor,
            modType: batchEditForm.modType || mod.modType,
            modVersion: batchEditForm.modVersion || mod.modVersion,
            modWebsite: batchEditForm.modWebsite || mod.modWebsite,
            tags: parsedTags.length ? parsedTags : mod.tags,
        });
    });

    syncTagsFromMods();
    await manager.saveManagerData();
    showBatchEditDialog.value = false;
    ElMessage.success("已更新所选 Mod 信息。");
}

function getTypeDefinition(mod: IModInfo) {
    return manager.availableTypes.find(
        (item) => String(item.id) === String(mod.modType ?? ""),
    );
}

async function executeTypeInstall(
    type: IType,
    installConfig: ITypeInstall,
    mod: IModInfo,
    isInstall: boolean,
) {
    const resolvedIsInstall = installConfig.isInstall ?? isInstall;

    switch (installConfig.UseFunction) {
        case "generalInstall":
            return Manager.generalInstall(
                mod,
                type.installPath,
                installConfig.keepPath,
                installConfig.inGameStorage,
            );
        case "generalUninstall":
            return Manager.generalUninstall(
                mod,
                type.installPath,
                installConfig.keepPath,
                installConfig.inGameStorage,
            );
        case "installByFolder":
            return Manager.installByFolder(
                mod,
                type.installPath,
                installConfig.folderName ?? "",
                resolvedIsInstall,
                installConfig.include,
                installConfig.spare,
            );
        case "installByFile":
            return Manager.installByFile(
                mod,
                type.installPath,
                installConfig.fileName ?? "",
                resolvedIsInstall,
                installConfig.isExtname,
                installConfig.inGameStorage,
            );
        case "installByFileSibling":
            return Manager.installByFileSibling(
                mod,
                type.installPath,
                installConfig.fileName ?? "",
                resolvedIsInstall,
                installConfig.isExtname,
                installConfig.inGameStorage,
                installConfig.pass,
            );
        case "installByFolderParent":
            return Manager.installByFolderParent(
                mod,
                type.installPath,
                installConfig.folderName ?? "",
                resolvedIsInstall,
                installConfig.inGameStorage,
            );
        default:
            return false;
    }
}

function isOperationSuccessful(result: IState[] | boolean) {
    if (typeof result === "boolean") {
        return result;
    }

    return result.every((item) => item.state);
}

function startAction(modId: number) {
    if (!actioningIds.value.includes(modId)) {
        actioningIds.value = [...actioningIds.value, modId];
    }
}

function finishAction(modId: number) {
    actioningIds.value = actioningIds.value.filter((item) => item !== modId);
}

async function toggleInstall(mod: IModInfo, install: boolean) {
    const type = getTypeDefinition(mod);

    if (!type) {
        ElMessage.warning("当前 Mod 没有可用的类型定义，请先检查类型设置。");
        return;
    }

    const handler = install ? type.install : type.uninstall;
    startAction(mod.id);

    try {
        const result =
            typeof handler === "function"
                ? await handler(mod)
                : await executeTypeInstall(type, handler, mod, install);

        if (!isOperationSuccessful(result)) {
            ElMessage.error(
                install
                    ? `安装 ${mod.modName} 失败，请检查游戏路径和文件权限。`
                    : `卸载 ${mod.modName} 失败，请检查目标文件是否被占用。`,
            );
            return;
        }

        mod.isInstalled = install;
        await manager.saveManagerData();
        ElMessage.success(
            install ? `已安装 ${mod.modName}` : `已卸载 ${mod.modName}`,
        );
    } catch (error: unknown) {
        console.error("执行 Mod 操作失败");
        console.error(error);
        ElMessage.error(
            install
                ? `安装 ${mod.modName} 失败，请查看控制台日志。`
                : `卸载 ${mod.modName} 失败，请查看控制台日志。`,
        );
    } finally {
        finishAction(mod.id);
    }
}

// ── GMM 包导入 ──────────────────────────────────────────────────────────────
async function importGmmFile() {
    if (!manager.managerRoot) {
        ElMessage.warning("请先选择游戏并配置储存路径。");
        return;
    }

    const selected = await open({
        directory: false,
        multiple: true,
        title: "选择 GMM 包文件",
        filters: [{ name: "GMM 包", extensions: ["gmm"] }],
    });

    if (!selected) {
        return;
    }

    const files = Array.isArray(selected) ? selected : [selected];
    importLoading.value = true;

    try {
        for (const file of files) {
            await installGmmPackage({ filePath: file, manager });
        }

        ElMessage.success("GMM 包导入完成。");
    } catch (error: unknown) {
        console.error("GMM 包导入失败");
        console.error(error);
        ElMessage.error("GMM 包导入失败，请查看控制台日志。");
    } finally {
        importLoading.value = false;
    }
}

// ── GMM 包导出 ──────────────────────────────────────────────────────────────
async function exportToGmm() {
    if (!manager.managerRoot) {
        return;
    }

    const modsToExport = manager.managerModList.filter((m) =>
        selectionIds.value.includes(m.id),
    );

    if (modsToExport.length === 0) {
        ElMessage.warning("请先选择至少一个 Mod 再导出。");
        return;
    }

    const savePath = await save({
        title: "导出为 GMM 包",
        filters: [{ name: "GMM 包", extensions: ["gmm"] }],
        defaultPath: exportForm.name || "export",
    });

    if (!savePath) {
        return;
    }

    exportLoading.value = true;

    try {
        await createGmmPackage({
            mods: modsToExport,
            managerRoot: manager.managerRoot,
            info: exportForm,
            outputPath: savePath,
        });
        ElMessage.success("GMM 包导出成功。");
        showExportDialog.value = false;
    } catch (error: unknown) {
        console.error("GMM 包导出失败");
        console.error(error);
        ElMessage.error("GMM 包导出失败，请查看控制台日志。");
    } finally {
        exportLoading.value = false;
    }
}

// ── 更新检查 ────────────────────────────────────────────────────────────────
async function checkForUpdates() {
    const glossMods = manager.managerModList.filter(
        (m) => typeof m.webId === "number" && m.webId > 0,
    );

    if (glossMods.length === 0) {
        ElMessage.info("当前没有来自 Gloss Mod 的 Mod 可检查更新。");
        return;
    }

    updateChecking.value = true;

    try {
        const webIds = glossMods
            .map((m) => m.webId)
            .filter((id): id is number => typeof id === "number" && id > 0);
        const updates = await checkGlossModUpdates(webIds);

        if (updates.length === 0) {
            ElMessage.success("所有 Mod 已是最新版本。");
            return;
        }

        for (const update of updates) {
            const localMod = glossMods.find((m) => m.webId === update.id);

            if (localMod) {
                await queueGlossModDownload({
                    modId: update.id,
                    replaceLocalModId: localMod.id,
                });
            }
        }

        ElMessage.success(`发现 ${updates.length} 个更新，已加入下载队列。`);
    } catch (error: unknown) {
        console.error("检查更新失败");
        console.error(error);
        ElMessage.error("检查更新失败，请查看控制台日志。");
    } finally {
        updateChecking.value = false;
    }
}

// ── 批量操作（安装/卸载/移除） ─────────────────────────────────────────────
async function batchInstall(install: boolean) {
    const targets = manager.managerModList.filter((m) =>
        selectionIds.value.includes(m.id),
    );

    for (const mod of targets) {
        await toggleInstall(mod, install);
    }
}

async function batchRemove() {
    const count = selectionIds.value.length;

    manager.managerModList = manager.managerModList.filter(
        (m) => !selectionIds.value.includes(m.id),
    );
    selectionIds.value = [];
    manager.selectionMode = false;
    await manager.saveManagerData();
    ElMessage.success(`已移除 ${count} 个 Mod。`);
}

// ── 窗口级拖拽导入 ──────────────────────────────────────────────────────────
onMounted(async () => {
    unlistenWindowDragDrop = await getCurrentWindow().onDragDropEvent(
        async (event) => {
            if (event.payload.type === "over") {
                windowDropActive.value = true;
            } else if (event.payload.type === "drop") {
                windowDropActive.value = false;

                if (!manager.managerRoot) {
                    return;
                }

                const paths = "paths" in event.payload ? event.payload.paths : [];
                const gmmFiles = paths.filter((p) =>
                    p.toLowerCase().endsWith(".gmm"),
                );
                const others = paths.filter(
                    (p) => !p.toLowerCase().endsWith(".gmm"),
                );

                for (const gmmFile of gmmFiles) {
                    await installGmmPackage({ filePath: gmmFile, manager });
                }

                if (others.length > 0) {
                    // resolveLocalModImportSourceType 返回 "archive" | "file"，
                    // 拖入的非压缩包文件统一按文件夹处理（允许直接拖入文件夹）
                    const sourceType =
                        resolveLocalModImportSourceType(others[0]) === "archive"
                            ? "archive"
                            : "folder";
                    await importSources(others, sourceType);
                }
            } else {
                windowDropActive.value = false;
            }
        },
    );
});

onUnmounted(() => {
    unlistenWindowDragDrop?.();
});

async function openModRootFolder() {
    if (!manager.managerRoot) {
        ElMessage.warning("请先配置储存路径并选择游戏。");
        return;
    }

    await FileHandler.openFolder(manager.managerRoot);
}

async function openGameFolder() {
    if (!manager.managerGame?.gamePath) {
        ElMessage.warning("当前游戏还没有配置安装目录。");
        return;
    }

    await FileHandler.openFolder(manager.managerGame?.gamePath ?? "");
}

async function importModFolder() {
    if (!manager.managerGame || !manager.managerRoot) {
        ElMessage.warning("请先选择游戏并配置储存路径。");
        return;
    }

    const selected = await open({
        directory: true,
        multiple: true,
        title: "选择要导入的 Mod 文件夹",
    });

    if (!selected) {
        return;
    }

    const folders = Array.isArray(selected) ? selected : [selected];
    await importSources(folders, "folder");
}

async function importModArchive() {
    if (!manager.managerGame || !manager.managerRoot) {
        ElMessage.warning("请先选择游戏并配置储存路径。");
        return;
    }

    const selected = await open({
        directory: false,
        multiple: true,
        title: "选择要导入的压缩包",
        filters: [
            {
                name: "压缩包",
                extensions: [...ARCHIVE_EXTENSIONS],
            },
        ],
    });

    if (!selected) {
        return;
    }

    const files = Array.isArray(selected) ? selected : [selected];
    await importSources(files, "archive");
}

async function importSources(
    sources: string[],
    sourceType: "archive" | "folder",
) {
    if (!manager.managerRoot) {
        return;
    }

    importLoading.value = true;

    try {
        const result = await importLocalModSources(
            manager,
            sources.map((source) => ({
                path: source,
                sourceType,
            })),
        );

        ElMessage.success(
            result.importedCount > 0
                ? `成功导入 ${result.importedCount} 个 Mod。`
                : "没有导入任何 Mod，请检查源文件内容。",
        );
    } catch (error: unknown) {
        console.error("导入 Mod 失败");
        console.error(error);
        ElMessage.error("导入 Mod 失败，请查看控制台日志。");
    } finally {
        importLoading.value = false;
    }
}

function getTypeCount(typeId: number | string | 0) {
    if (typeId === 0) {
        return manager.managerModList.length;
    }

    return manager.managerModList.filter(
        (mod) => String(mod.modType ?? "") === String(typeId),
    ).length;
}

function openSettingsPage() {
    void router.push("/settings");
}

function openGamesPage() {
    void router.push("/games");
}
</script>
<template>
    <div class="flex flex-col gap-6">
        <Card v-if="!storagePath">
            <CardHeader>
                <CardTitle>先配置储存路径</CardTitle>
                <CardDescription>
                    管理页会从储存路径下的 mods/游戏名 目录读取本地 Mod 数据。
                </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-wrap items-center gap-3">
                <Button @click="openSettingsPage">
                    <Settings2 class="h-4 w-4" />
                    前往设置
                </Button>
                <p class="text-sm text-muted-foreground">
                    当前未检测到储存路径，配置后即可开始管理本地 Mod。
                </p>
            </CardContent>
        </Card>

        <Card v-else-if="!manager.managerGame">
            <CardHeader>
                <CardTitle>先选择一个游戏</CardTitle>
                <CardDescription>
                    选择游戏后，管理页会自动读取对应的 Mod 目录并恢复本地列表。
                </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-wrap items-center gap-3">
                <SelectGame />
                <Button variant="outline" @click="openGamesPage">
                    <Gamepad2 class="h-4 w-4" />
                    打开游戏库
                </Button>
            </CardContent>
        </Card>

        <template v-else>
            <Card>
                <CardHeader>
                    <CardTitle
                        class="flex flex-wrap justify-between items-center gap-3"
                    >
                        <h3 class="text-2xl">Mod 管理</h3>
                        <div>
                            当前游戏『
                            {{
                                $t(
                                    manager.managerGame.gameShowName ||
                                        manager.managerGame.gameName,
                                )
                            }}
                            』
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent class="flex flex-col gap-4">
                    <div class="flex flex-wrap items-center gap-4">
                        <div class="flex flex-wrap items-center gap-2">
                            <SelectGame />
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="secondary">
                                        <FolderPlus class="h-4 w-4" />导入
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem @click="importModFolder">
                                        <FolderPlus class="h-4 w-4" />
                                        导入文件夹
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="importModArchive">
                                        <FolderPlus class="h-4 w-4" />
                                        导入压缩包
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem @click="importGmmFile">
                                        <Package class="h-4 w-4" />
                                        导入 GMM 包
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <StartGame :game="manager.managerGame" />
                            <Button variant="outline" @click="loadManagerData">
                                <RefreshCw class="h-4 w-4" />
                                刷新
                            </Button>
                            <Button
                                variant="outline"
                                :disabled="updateChecking"
                                @click="checkForUpdates"
                            >
                                <Download class="h-4 w-4" />
                                {{ updateChecking ? "检查中…" : "检查更新" }}
                            </Button>
                            <Button
                                :variant="
                                    selectionMode ? 'default' : 'outline'
                                "
                                @click="
                                    manager.selectionMode =
                                        !manager.selectionMode
                                "
                            >
                                <CheckSquare class="h-4 w-4" />
                                多选
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="outline">
                                        <IconMenu class="h-4 w-4" />
                                        更多
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" class="w-56">
                                    <DropdownMenuItem
                                        @click="openModRootFolder"
                                    >
                                        <FolderOpen class="h-4 w-4" />
                                        打开 Mod 目录
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="openGameFolder">
                                        <FolderOpen class="h-4 w-4" />
                                        打开游戏目录
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        :disabled="!selectionIds.length"
                                        @click="showExportDialog = true"
                                    >
                                        <Upload class="h-4 w-4" />
                                        导出 GMM 包
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <InputGroup>
                            <InputGroupInput
                                v-model="manager.search"
                                placeholder="搜索名称、作者、版本、标签或类型"
                            />
                            <InputGroupAddon>
                                <Search />
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                        <Button
                            :variant="
                                manager.selectedType === 0
                                    ? 'default'
                                    : 'outline'
                            "
                            size="sm"
                            @click="manager.selectedType = 0"
                        >
                            全部 ({{ getTypeCount(0) }})
                        </Button>
                        <Button
                            v-for="item in manager.availableTypes"
                            :key="item.id"
                            :variant="
                                manager.selectedType === item.id
                                    ? 'default'
                                    : 'outline'
                            "
                            size="sm"
                            @click="manager.selectedType = item.id"
                        >
                            {{ item.name }} ({{ getTypeCount(item.id) }})
                        </Button>
                    </div>
                    <ManagerTags />
                </CardContent>
            </Card>
            <ManagerPreloadList />
            <ManagerList />

            <Card v-if="loadError">
                <CardContent
                    class="flex items-center justify-between gap-4 py-6"
                >
                    <p class="text-sm text-destructive">{{ loadError }}</p>
                    <Button variant="outline" @click="loadManagerData"
                        >重试</Button
                    >
                </CardContent>
            </Card>
            <div
                v-else-if="manager.filteredMods.length === 0"
                class="rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground"
            >
                <p>当前没有匹配的 Mod。</p>
                <p class="mt-2">
                    你可以调整筛选条件，或从上方导入文件夹/压缩包来创建本地 Mod
                    条目。
                </p>
            </div>
            <!-- 多选操作工具栏 -->
            <div
                v-if="selectionMode"
                class="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-background/90 px-4 py-2 shadow-md backdrop-blur"
            >
                <span class="text-sm text-muted-foreground">
                    已选 {{ selectionIds.length }} /
                    {{ manager.filteredMods.length }}
                </span>
                <Button
                    size="sm"
                    variant="ghost"
                    @click="manager.selectAllVisible()"
                >
                    <CheckCheck class="h-4 w-4" />
                    全选
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    @click="manager.clearSelection()"
                >
                    取消
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="!selectionIds.length"
                    @click="batchInstall(true)"
                >
                    <Shuffle class="h-4 w-4" />
                    批量安装
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="!selectionIds.length"
                    @click="batchInstall(false)"
                >
                    批量卸载
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="!selectionIds.length"
                    @click="showBatchEditDialog = true"
                >
                    <SquarePen class="h-4 w-4" />
                    批量编辑
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    :disabled="!selectionIds.length"
                    @click="batchRemove"
                >
                    <Trash2 class="h-4 w-4" />
                    批量移除
                </Button>
            </div>

            <!-- 批量编辑 Dialog -->
            <Dialog v-model:open="showBatchEditDialog">
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>批量编辑 Mod 信息</DialogTitle>
                        <DialogDescription>
                            仅填写需要修改的字段，留空表示不修改。
                        </DialogDescription>
                    </DialogHeader>
                    <div class="grid gap-3 py-2">
                        <div class="grid grid-cols-4 items-center gap-3">
                            <Label class="text-right">作者</Label>
                            <Input
                                v-model="batchEditForm.modAuthor"
                                class="col-span-3"
                                placeholder="留空表示不修改"
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-3">
                            <Label class="text-right">版本</Label>
                            <Input
                                v-model="batchEditForm.modVersion"
                                class="col-span-3"
                                placeholder="留空表示不修改"
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-3">
                            <Label class="text-right">网站</Label>
                            <Input
                                v-model="batchEditForm.modWebsite"
                                class="col-span-3"
                                placeholder="留空表示不修改"
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-3">
                            <Label class="text-right">标签</Label>
                            <Input
                                v-model="batchEditForm.tagsText"
                                class="col-span-3"
                                placeholder="逗号分隔，留空表示不修改"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            @click="showBatchEditDialog = false"
                            >取消</Button
                        >
                        <Button @click="applyBatchEdit">确定</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <!-- GMM 包导出 Dialog -->
            <Dialog v-model:open="showExportDialog">
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>导出 GMM 包</DialogTitle>
                        <DialogDescription>
                            将已选中的 {{ selectionIds.length }} 个 Mod
                            打包为 *.gmm 文件。
                        </DialogDescription>
                    </DialogHeader>
                    <div class="grid gap-3 py-2">
                        <div class="grid grid-cols-4 items-center gap-3">
                            <Label class="text-right">包名</Label>
                            <Input
                                v-model="exportForm.name"
                                class="col-span-3"
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-3">
                            <Label class="text-right">版本</Label>
                            <Input
                                v-model="exportForm.version"
                                class="col-span-3"
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-3">
                            <Label class="text-right">作者</Label>
                            <Input
                                v-model="exportForm.author"
                                class="col-span-3"
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-3">
                            <Label class="text-right">描述</Label>
                            <Input
                                v-model="exportForm.description"
                                class="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            @click="showExportDialog = false"
                            >取消</Button
                        >
                        <Button :disabled="exportLoading" @click="exportToGmm">
                            {{ exportLoading ? "导出中…" : "导出" }}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <!-- 窗口拖拽导入提示浮层 -->
            <Transition name="fade">
                <div
                    v-if="windowDropActive"
                    class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center rounded-lg border-4 border-dashed border-primary bg-background/70 text-2xl font-bold text-primary backdrop-blur-sm"
                >
                    松开以导入 Mod
                </div>
            </Transition>
        </template>
    </div>
</template>
<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
