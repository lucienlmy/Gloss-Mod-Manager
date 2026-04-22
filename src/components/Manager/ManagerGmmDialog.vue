<script setup lang="ts">
import { open, save } from "@tauri-apps/plugin-dialog";
import { ElMessage } from "element-plus-message";
import {
    Check,
    Download,
    LoaderCircle,
    Package,
    RefreshCw,
    Upload,
} from "lucide-vue-next";
import {
    createGmmPackage,
    installGmmPackage,
    readGmmPackageDetails,
    resolveGmmPackFolderKey,
    type IGmmPackageDetails,
} from "@/lib/gmm-package";

type TGmmDialogMode = "import" | "export";
type TGmmDialogStep = 1 | 2 | 3;
type TInstallGmmResult = Awaited<ReturnType<typeof installGmmPackage>>;
type TCreateGmmResult = Awaited<ReturnType<typeof createGmmPackage>>;

interface IImportPackOption {
    folderKey: string;
    pack: IModInfo;
    duplicate: boolean;
}

interface IManagerGmmDialogExpose {
    openImportDialog: (filePath?: string) => Promise<void>;
    openExportDialog: () => void;
}

const manager = useManager();
const { selectedMods } = storeToRefs(manager);

const dialogOpen = ref(false);
const dialogMode = ref<TGmmDialogMode>("import");
const dialogStep = ref<TGmmDialogStep>(1);

const importReading = ref(false);
const importInstalling = ref(false);
const importFilePath = ref("");
const importPackageDetails = ref<IGmmPackageDetails | null>(null);
const selectedImportFolderKeys = ref<string[]>([]);
const importResult = ref<TInstallGmmResult | null>(null);
const importError = ref("");

const exportCreating = ref(false);
const exportResult = ref<TCreateGmmResult | null>(null);
const exportError = ref("");
const exportSearch = ref("");
const exportTypeFilter = ref<number | string | 0>(0);
const exportTagFilter = ref("全部");
const selectedExportIds = ref<number[]>([]);
const exportForm = reactive<IInfo>({
    name: "",
    version: "1.0.0",
    description: "",
    gameID: undefined,
    author: "",
});

const isBusy = computed(() => {
    return (
        importReading.value || importInstalling.value || exportCreating.value
    );
});

const currentStepLabels = computed(() => {
    return dialogMode.value === "import"
        ? ["包信息", "选择内容", "安装结果"]
        : ["填写信息与选择内容", "确认内容", "打包结果"];
});

const dialogTitle = computed(() => {
    return dialogMode.value === "import" ? "安装 GMM 包" : "打包 GMM 包";
});

const dialogDescription = computed(() => {
    return dialogMode.value === "import"
        ? "参考旧版 Pack 流程，先预览包信息，再选择需要安装的 Mod。"
        : "先在弹窗内按类型、标签筛选并选择 Mod，再生成一个 *.gmm 包。";
});

function sortModsByWeight(list: IModInfo[]) {
    return [...list].sort((left, right) => {
        const leftWeight = Number.isFinite(left.weight) ? left.weight : 0;
        const rightWeight = Number.isFinite(right.weight) ? right.weight : 0;
        const weightDiff = leftWeight - rightWeight;

        if (weightDiff !== 0) {
            return weightDiff;
        }

        return left.id - right.id;
    });
}

const importPackOptions = computed<IImportPackOption[]>(() => {
    return (importPackageDetails.value?.packs ?? []).map((pack) => {
        const duplicate =
            Boolean(pack.md5) &&
            manager.managerModList.some((mod) => {
                return Boolean(mod.md5) && mod.md5 === pack.md5;
            });

        return {
            pack,
            folderKey: resolveGmmPackFolderKey(pack),
            duplicate,
        };
    });
});

const importGameMismatch = computed(() => {
    const packageGameId = importPackageDetails.value?.info.gameID;
    const currentGameId = manager.managerGame?.GlossGameId;

    if (!packageGameId || !currentGameId) {
        return false;
    }

    return Number(packageGameId) !== Number(currentGameId);
});

const selectableImportKeys = computed(() => {
    return importPackOptions.value
        .filter((option) => !option.duplicate)
        .map((option) => option.folderKey);
});

const duplicateImportCount = computed(() => {
    return importPackOptions.value.filter((option) => option.duplicate).length;
});

const exportSelectedMods = computed<IModInfo[]>(() => {
    const selectedIdSet = new Set(selectedExportIds.value);

    return sortModsByWeight(manager.managerModList).filter((mod) => {
        return selectedIdSet.has(mod.id);
    });
});

const exportFilteredMods = computed<IModInfo[]>(() => {
    const keyword = exportSearch.value.trim().toLowerCase();

    return sortModsByWeight(manager.managerModList)
        .filter((mod) => {
            if (exportTypeFilter.value === 0) {
                return true;
            }

            return String(mod.modType ?? "") === String(exportTypeFilter.value);
        })
        .filter((mod) => {
            if (exportTagFilter.value === "全部") {
                return true;
            }

            return (mod.tags ?? []).some((tag) => tag.name === exportTagFilter.value);
        })
        .filter((mod) => {
            if (!keyword) {
                return true;
            }

            const joinedTags = (mod.tags ?? []).map((tag) => tag.name).join(" ");
            const joinedText = [
                mod.modName,
                mod.modAuthor ?? "",
                mod.modVersion,
                mod.fileName,
                mod.modDesc ?? "",
                joinedTags,
                manager.getTypeName(mod.modType),
            ]
                .join(" ")
                .toLowerCase();

            return joinedText.includes(keyword);
        });
});

const exportSelectedCount = computed(() => {
    return exportSelectedMods.value.length;
});

const selectedImportCount = computed(() => {
    return selectedImportFolderKeys.value.length;
});

const canStartImport = computed(() => {
    return (
        !importInstalling.value &&
        !importGameMismatch.value &&
        selectedImportFolderKeys.value.length > 0
    );
});

const canStartExport = computed(() => {
    return (
        !exportCreating.value &&
        exportSelectedMods.value.length > 0 &&
        Boolean(exportForm.name?.trim()) &&
        Boolean(exportForm.version.trim())
    );
});

function normalizeSlashes(filePath: string) {
    return filePath.replace(/\\+/gu, "/");
}

function getBaseName(filePath: string) {
    const normalized = normalizeSlashes(filePath);
    return normalized.split("/").pop() ?? filePath;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallbackMessage;
}

function createDefaultExportName(mods: IModInfo[] = exportSelectedMods.value) {
    if (mods.length === 1) {
        return mods[0]?.modName ?? "export";
    }

    const gameName =
        manager.managerGame?.gameShowName ||
        manager.managerGame?.gameName ||
        "mods";

    return mods.length > 1 ? `${gameName}-${mods.length}mods` : `${gameName}-export`;
}

function createDefaultExportAuthor(mods: IModInfo[] = exportSelectedMods.value) {
    const authorList = [
        ...new Set(
            mods
                .map((mod) => mod.modAuthor?.trim() ?? "")
                .filter(Boolean),
        ),
    ];

    if (authorList.length === 1) {
        return authorList[0] ?? "";
    }

    return "";
}

function createDefaultExportDescription(mods: IModInfo[] = exportSelectedMods.value) {
    if (mods.length === 1) {
        return mods[0]?.modDesc ?? "";
    }

    return "";
}

function applyExportDefaults(mods: IModInfo[] = exportSelectedMods.value) {
    exportForm.name = createDefaultExportName(mods);
    exportForm.version = "1.0.0";
    exportForm.description = createDefaultExportDescription(mods);
    exportForm.gameID = manager.managerGame?.GlossGameId;
    exportForm.author = createDefaultExportAuthor(mods);
}

function resetImportState() {
    importReading.value = false;
    importInstalling.value = false;
    importFilePath.value = "";
    importPackageDetails.value = null;
    selectedImportFolderKeys.value = [];
    importResult.value = null;
    importError.value = "";
}

function resetExportState() {
    exportCreating.value = false;
    exportResult.value = null;
    exportError.value = "";
    exportSearch.value = "";
    exportTypeFilter.value = 0;
    exportTagFilter.value = "全部";
    selectedExportIds.value = [];
    applyExportDefaults([]);
}

function resetDialogState() {
    dialogStep.value = 1;
    resetImportState();
    resetExportState();
}

function closeDialog() {
    if (isBusy.value) {
        ElMessage.warning("请等待当前操作完成。");
        return;
    }

    dialogOpen.value = false;
}

function preventDialogClose(event: { preventDefault: () => void }) {
    if (!isBusy.value) {
        return;
    }

    event.preventDefault();
}

function openImportStep(filePath: string, packageDetails: IGmmPackageDetails) {
    dialogMode.value = "import";
    dialogStep.value = 1;
    importFilePath.value = filePath;
    importPackageDetails.value = packageDetails;
    importResult.value = null;
    importError.value = "";

    // 默认勾选未重复的内容，避免把已存在的 Mod 再次加入本地库。
    selectedImportFolderKeys.value = packageDetails.packs
        .filter((pack) => {
            return !(
                pack.md5 &&
                manager.managerModList.some((mod) => {
                    return Boolean(mod.md5) && mod.md5 === pack.md5;
                })
            );
        })
        .map((pack) => resolveGmmPackFolderKey(pack));

    dialogOpen.value = true;
}

async function openImportDialog(filePath?: string) {
    if (!manager.managerRoot || !manager.managerGame) {
        ElMessage.warning("请先选择游戏并配置储存路径。");
        return;
    }

    const selectedFile =
        filePath ??
        (await open({
            directory: false,
            multiple: false,
            title: "选择 GMM 包文件",
            filters: [{ name: "GMM 包", extensions: ["gmm"] }],
        }));

    if (!selectedFile || Array.isArray(selectedFile)) {
        return;
    }

    resetImportState();
    importReading.value = true;

    try {
        const packageDetails = await readGmmPackageDetails(selectedFile);
        openImportStep(selectedFile, packageDetails);
    } catch (error: unknown) {
        const errorMessage = getErrorMessage(
            error,
            "读取 GMM 包信息失败，请查看控制台日志。",
        );

        console.error("读取 GMM 包信息失败");
        console.error(error);
        ElMessage.error(errorMessage);
    } finally {
        importReading.value = false;
    }
}

function openExportDialog() {
    if (!manager.managerRoot) {
        ElMessage.warning("请先选择游戏并配置储存路径。");
        return;
    }

    if (manager.managerModList.length === 0) {
        ElMessage.warning("当前没有可导出的 Mod。");
        return;
    }

    dialogMode.value = "export";
    dialogStep.value = 1;
    resetExportState();
    selectedExportIds.value = selectedMods.value.map((mod) => mod.id);
    applyExportDefaults(exportSelectedMods.value);
    dialogOpen.value = true;
}

function toggleImportSelection(folderKey: string, selected: boolean) {
    if (selected) {
        selectedImportFolderKeys.value = [
            ...new Set([...selectedImportFolderKeys.value, folderKey]),
        ];
        return;
    }

    selectedImportFolderKeys.value = selectedImportFolderKeys.value.filter(
        (key) => key !== folderKey,
    );
}

function handleImportSelectionChange(folderKey: string, event: Event) {
    const target = event.target as HTMLInputElement | null;
    toggleImportSelection(folderKey, Boolean(target?.checked));
}

function selectAllImportPacks() {
    selectedImportFolderKeys.value = [...selectableImportKeys.value];
}

function clearImportSelection() {
    selectedImportFolderKeys.value = [];
}

function validateExportForm() {
    if (exportSelectedMods.value.length === 0) {
        ElMessage.warning("请先选择至少一个 Mod 再打包。");
        return false;
    }

    if (!exportForm.name?.trim()) {
        ElMessage.warning("请先填写包名。");
        return false;
    }

    if (!exportForm.version.trim()) {
        ElMessage.warning("请先填写版本号。");
        return false;
    }

    return true;
}

function prevStep() {
    if (isBusy.value || dialogStep.value === 1) {
        return;
    }

    dialogStep.value = (dialogStep.value - 1) as TGmmDialogStep;
}

function nextImportStep() {
    if (dialogStep.value === 1) {
        dialogStep.value = 2;
        return;
    }

    if (dialogStep.value === 2) {
        void installSelectedPacks();
    }
}

function nextExportStep() {
    if (dialogStep.value === 1) {
        if (!validateExportForm()) {
            return;
        }

        dialogStep.value = 2;
        return;
    }

    if (dialogStep.value === 2) {
        void createPackageFile();
    }
}

function retryCurrentAction() {
    if (dialogMode.value === "import") {
        dialogStep.value = 2;
        void installSelectedPacks();
        return;
    }

    dialogStep.value = 2;
    void createPackageFile();
}

async function installSelectedPacks() {
    if (!importPackageDetails.value) {
        ElMessage.warning("当前没有可安装的 GMM 包信息。");
        return;
    }

    if (!canStartImport.value) {
        ElMessage.warning("请先选择至少一个可安装的 Mod。");
        return;
    }

    dialogStep.value = 3;
    importInstalling.value = true;
    importResult.value = null;
    importError.value = "";

    try {
        importResult.value = await installGmmPackage({
            filePath: importFilePath.value,
            manager,
            selectedFolderKeys: selectedImportFolderKeys.value,
        });

        if (importResult.value.importedMods.length > 0) {
            ElMessage.success(
                `成功安装 ${importResult.value.importedMods.length} 个 Mod。`,
            );
            return;
        }

        ElMessage.warning("没有安装新的 Mod，可能都已存在或内容缺失。");
    } catch (error: unknown) {
        importError.value = getErrorMessage(
            error,
            "GMM 包安装失败，请查看控制台日志。",
        );
        console.error("GMM 包安装失败");
        console.error(error);
        ElMessage.error(importError.value);
    } finally {
        importInstalling.value = false;
    }
}

async function createPackageFile() {
    if (!manager.managerRoot) {
        ElMessage.warning("当前没有可用的 Mod 储存目录。");
        return;
    }

    if (!validateExportForm()) {
        return;
    }

    const savePath = await save({
        title: "导出为 GMM 包",
        filters: [{ name: "GMM 包", extensions: ["gmm"] }],
        defaultPath: exportForm.name?.trim() || "export",
    });

    if (!savePath) {
        return;
    }

    dialogStep.value = 3;
    exportCreating.value = true;
    exportResult.value = null;
    exportError.value = "";

    try {
        exportResult.value = await createGmmPackage({
            mods: exportSelectedMods.value,
            managerRoot: manager.managerRoot,
            info: {
                ...exportForm,
                name: exportForm.name?.trim(),
                version: exportForm.version.trim(),
                description: exportForm.description?.trim(),
                author: exportForm.author?.trim(),
            },
            outputPath: savePath,
        });

        ElMessage.success(
            `GMM 包导出成功，共打包 ${exportResult.value.packCount} 个 Mod。`,
        );
    } catch (error: unknown) {
        exportError.value = getErrorMessage(
            error,
            "GMM 包导出失败，请查看控制台日志。",
        );
        console.error("GMM 包导出失败");
        console.error(error);
        ElMessage.error(exportError.value);
    } finally {
        exportCreating.value = false;
    }
}

function toggleExportSelection(modId: number, selected?: boolean) {
    const selectedIdSet = new Set(selectedExportIds.value);
    const shouldSelect = selected ?? !selectedIdSet.has(modId);

    if (shouldSelect) {
        selectedIdSet.add(modId);
    } else {
        selectedIdSet.delete(modId);
    }

    selectedExportIds.value = [...selectedIdSet];
}

function handleExportSelectionChange(modId: number, event: Event) {
    const target = event.target as HTMLInputElement | null;
    toggleExportSelection(modId, Boolean(target?.checked));
}

function selectAllFilteredExportMods() {
    const selectedIdSet = new Set(selectedExportIds.value);

    for (const mod of exportFilteredMods.value) {
        selectedIdSet.add(mod.id);
    }

    selectedExportIds.value = [...selectedIdSet];
}

function clearExportSelection() {
    selectedExportIds.value = [];
}

function getExportTypeCount(typeId: number | string | 0) {
    if (typeId === 0) {
        return manager.managerModList.length;
    }

    return manager.managerModList.filter((mod) => {
        return String(mod.modType ?? "") === String(typeId);
    }).length;
}

function getExportTagCount(tagName: string) {
    if (tagName === "全部") {
        return manager.managerModList.length;
    }

    return manager.managerModList.filter((mod) => {
        return (mod.tags ?? []).some((tag) => tag.name === tagName);
    }).length;
}

watch(dialogOpen, (opened) => {
    if (opened) {
        return;
    }

    if (isBusy.value) {
        dialogOpen.value = true;
        return;
    }

    resetDialogState();
});

defineExpose<IManagerGmmDialogExpose>({
    openImportDialog,
    openExportDialog,
});
</script>

<template>
    <Dialog v-model:open="dialogOpen">
        <DialogContent
            class="sm:max-w-4xl"
            :show-close-button="!isBusy"
            @escape-key-down="preventDialogClose"
            @pointer-down-outside="preventDialogClose"
        >
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <Package class="h-5 w-5" />
                    {{ dialogTitle }}
                </DialogTitle>
                <DialogDescription>
                    {{ dialogDescription }}
                </DialogDescription>
            </DialogHeader>

            <div class="flex flex-wrap gap-2">
                <Badge
                    v-for="(label, index) in currentStepLabels"
                    :key="label"
                    :variant="dialogStep === index + 1 ? 'default' : 'outline'"
                    class="rounded-full px-3 py-1"
                >
                    {{ index + 1 }}. {{ label }}
                </Badge>
            </div>

            <Separator />

            <div v-if="dialogMode === 'import'" class="grid gap-4">
                <template v-if="dialogStep === 1">
                    <div
                        v-if="importReading"
                        class="flex min-h-52 items-center justify-center rounded-lg border border-dashed"
                    >
                        <div
                            class="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <LoaderCircle class="h-4 w-4 animate-spin" />
                            正在读取 GMM 包信息…
                        </div>
                    </div>

                    <template v-else-if="importPackageDetails">
                        <div
                            class="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle class="flex items-center gap-2">
                                        <Download class="h-4 w-4" />
                                        {{
                                            importPackageDetails.info.name ||
                                            getBaseName(importFilePath)
                                        }}
                                    </CardTitle>
                                    <CardDescription>
                                        {{ getBaseName(importFilePath) }}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent class="grid gap-4">
                                    <div class="flex flex-wrap gap-2">
                                        <Badge variant="secondary">
                                            作者：{{
                                                importPackageDetails.info
                                                    .author || "未填写"
                                            }}
                                        </Badge>
                                        <Badge variant="outline">
                                            版本：{{
                                                importPackageDetails.info
                                                    .version || "1.0.0"
                                            }}
                                        </Badge>
                                        <Badge variant="outline">
                                            游戏 ID：{{
                                                importPackageDetails.info
                                                    .gameID ?? "未指定"
                                            }}
                                        </Badge>
                                    </div>
                                    <div
                                        class="rounded-lg border bg-muted/30 px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-muted-foreground"
                                    >
                                        {{
                                            importPackageDetails.info.description?.trim() ||
                                            "这个 GMM 包没有填写描述。"
                                        }}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle class="text-base">
                                        安装概览
                                    </CardTitle>
                                </CardHeader>
                                <CardContent class="grid gap-3 text-sm">
                                    <div
                                        class="flex items-center justify-between rounded-lg border px-3 py-2"
                                    >
                                        <span class="text-muted-foreground">
                                            包含内容
                                        </span>
                                        <span class="font-medium">
                                            {{ importPackOptions.length }} 项
                                        </span>
                                    </div>
                                    <div
                                        class="flex items-center justify-between rounded-lg border px-3 py-2"
                                    >
                                        <span class="text-muted-foreground">
                                            可安装
                                        </span>
                                        <span class="font-medium">
                                            {{
                                                importPackOptions.length -
                                                duplicateImportCount
                                            }}
                                            项
                                        </span>
                                    </div>
                                    <div
                                        class="flex items-center justify-between rounded-lg border px-3 py-2"
                                    >
                                        <span class="text-muted-foreground">
                                            已存在
                                        </span>
                                        <span class="font-medium">
                                            {{ duplicateImportCount }} 项
                                        </span>
                                    </div>
                                    <div
                                        class="flex items-center justify-between rounded-lg border px-3 py-2"
                                    >
                                        <span class="text-muted-foreground">
                                            当前游戏
                                        </span>
                                        <span class="font-medium">
                                            {{
                                                manager.managerGame
                                                    ?.gameShowName ||
                                                manager.managerGame?.gameName ||
                                                "未选择"
                                            }}
                                        </span>
                                    </div>
                                    <p
                                        v-if="importGameMismatch"
                                        class="rounded-lg border border-destructive/30 bg-destructive/6 px-3 py-2 text-destructive"
                                    >
                                        当前 GMM 包的游戏 ID
                                        与已选游戏不一致，暂不可安装。
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </template>

                    <div
                        v-else
                        class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                        未读取到 GMM 包信息。
                    </div>
                </template>

                <template v-else-if="dialogStep === 2">
                    <div
                        class="flex flex-wrap items-center justify-between gap-3"
                    >
                        <div class="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                                已选 {{ selectedImportCount }} 项
                            </Badge>
                            <Badge variant="outline">
                                可安装 {{ selectableImportKeys.length }} 项
                            </Badge>
                            <Badge variant="outline">
                                已存在 {{ duplicateImportCount }} 项
                            </Badge>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                @click="selectAllImportPacks"
                            >
                                全选可安装
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                @click="clearImportSelection"
                            >
                                清空选择
                            </Button>
                        </div>
                    </div>

                    <div
                        v-if="importPackOptions.length === 0"
                        class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                        当前 GMM 包没有可识别的 Mod 条目。
                    </div>

                    <div v-else class="grid gap-3 pr-1">
                        <label
                            v-for="option in importPackOptions"
                            :key="option.folderKey"
                            class="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors"
                            :class="
                                option.duplicate
                                    ? 'cursor-not-allowed border-dashed opacity-60'
                                    : 'hover:bg-muted/40'
                            "
                        >
                            <input
                                class="mt-1 h-4 w-4 accent-primary"
                                type="checkbox"
                                :checked="
                                    selectedImportFolderKeys.includes(
                                        option.folderKey,
                                    )
                                "
                                :disabled="option.duplicate || importInstalling"
                                @change="
                                    handleImportSelectionChange(
                                        option.folderKey,
                                        $event,
                                    )
                                "
                            />
                            <div class="min-w-0 flex-1 space-y-2">
                                <div
                                    class="flex flex-wrap items-center gap-2 text-sm"
                                >
                                    <span class="font-medium text-foreground">
                                        {{ option.pack.modName }}
                                    </span>
                                    <Badge variant="outline">
                                        v{{ option.pack.modVersion }}
                                    </Badge>
                                    <Badge
                                        v-if="option.duplicate"
                                        variant="destructive"
                                    >
                                        已存在
                                    </Badge>
                                    <Badge v-else variant="secondary">
                                        可安装
                                    </Badge>
                                </div>
                                <div
                                    class="flex flex-wrap gap-2 text-xs text-muted-foreground"
                                >
                                    <span>
                                        作者：{{
                                            option.pack.modAuthor || "未填写"
                                        }}
                                    </span>
                                    <span>
                                        类型：{{
                                            manager.getTypeName(
                                                option.pack.modType,
                                            )
                                        }}
                                    </span>
                                    <span v-if="option.pack.md5">
                                        MD5：{{ option.pack.md5 }}
                                    </span>
                                </div>
                            </div>
                        </label>
                    </div>

                    <p
                        v-if="importGameMismatch"
                        class="rounded-lg border border-destructive/30 bg-destructive/6 px-3 py-2 text-sm text-destructive"
                    >
                        当前 GMM 包不属于已选游戏，无法继续安装。
                    </p>
                </template>

                <template v-else>
                    <div
                        v-if="importInstalling"
                        class="flex min-h-56 items-center justify-center rounded-lg border border-dashed"
                    >
                        <div
                            class="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <LoaderCircle class="h-4 w-4 animate-spin" />
                            正在安装所选 Mod…
                        </div>
                    </div>

                    <div
                        v-else-if="importError"
                        class="grid gap-4 rounded-xl border border-destructive/30 bg-destructive/6 p-4"
                    >
                        <div class="flex items-center gap-2 text-destructive">
                            <RefreshCw class="h-4 w-4" />
                            安装失败
                        </div>
                        <p class="text-sm leading-6 text-destructive">
                            {{ importError }}
                        </p>
                    </div>

                    <div
                        v-else-if="importResult"
                        class="grid gap-4 md:grid-cols-2"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle class="flex items-center gap-2">
                                    <Check class="h-4 w-4 text-green-600" />
                                    安装完成
                                </CardTitle>
                                <CardDescription>
                                    {{
                                        importResult.importedMods.length > 0
                                            ? `共新增 ${importResult.importedMods.length} 个 Mod。`
                                            : "没有新增 Mod。"
                                    }}
                                </CardDescription>
                            </CardHeader>
                            <CardContent class="grid gap-2 text-sm">
                                <div
                                    class="flex items-center justify-between rounded-lg border px-3 py-2"
                                >
                                    <span class="text-muted-foreground">
                                        新增
                                    </span>
                                    <span class="font-medium">
                                        {{ importResult.importedMods.length }}
                                        项
                                    </span>
                                </div>
                                <div
                                    class="flex items-center justify-between rounded-lg border px-3 py-2"
                                >
                                    <span class="text-muted-foreground">
                                        跳过
                                    </span>
                                    <span class="font-medium">
                                        {{ importResult.skippedPacks.length }}
                                        项
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle class="text-base">
                                    结果明细
                                </CardTitle>
                            </CardHeader>
                            <CardContent class="grid gap-3 text-sm">
                                <div>
                                    <p class="mb-2 text-muted-foreground">
                                        已安装
                                    </p>
                                    <ul
                                        class="grid max-h-32 gap-2 overflow-auto"
                                    >
                                        <li
                                            v-for="item in importResult.importedMods"
                                            :key="item.id"
                                            class="rounded-lg border px-3 py-2"
                                        >
                                            {{ item.modName }}
                                        </li>
                                        <li
                                            v-if="
                                                importResult.importedMods
                                                    .length === 0
                                            "
                                            class="rounded-lg border border-dashed px-3 py-2 text-muted-foreground"
                                        >
                                            没有新增条目。
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <p class="mb-2 text-muted-foreground">
                                        已跳过
                                    </p>
                                    <ul
                                        class="grid max-h-32 gap-2 overflow-auto"
                                    >
                                        <li
                                            v-for="item in importResult.skippedPacks"
                                            :key="resolveGmmPackFolderKey(item)"
                                            class="rounded-lg border px-3 py-2"
                                        >
                                            {{ item.modName }}
                                        </li>
                                        <li
                                            v-if="
                                                importResult.skippedPacks
                                                    .length === 0
                                            "
                                            class="rounded-lg border border-dashed px-3 py-2 text-muted-foreground"
                                        >
                                            没有跳过内容。
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </template>
            </div>

            <div v-else class="grid gap-4">
                <template v-if="dialogStep === 1">
                    <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
                        <Card>
                            <CardHeader>
                                <CardTitle class="flex items-center gap-2">
                                    <Upload class="h-4 w-4" />
                                    包信息
                                </CardTitle>
                                <CardDescription>
                                    这些信息会写入 GMM 包的 info.json。
                                </CardDescription>
                            </CardHeader>
                            <CardContent class="grid gap-4">
                                <div class="grid gap-2">
                                    <Label for="gmm-pack-name">包名</Label>
                                    <Input
                                        id="gmm-pack-name"
                                        v-model="exportForm.name"
                                        placeholder="请输入包名"
                                    />
                                </div>
                                <div class="grid gap-2 md:grid-cols-2">
                                    <div class="grid gap-2">
                                        <Label for="gmm-pack-version">
                                            版本
                                        </Label>
                                        <Input
                                            id="gmm-pack-version"
                                            v-model="exportForm.version"
                                            placeholder="1.0.0"
                                        />
                                    </div>
                                    <div class="grid gap-2">
                                        <Label for="gmm-pack-author">
                                            作者
                                        </Label>
                                        <Input
                                            id="gmm-pack-author"
                                            v-model="exportForm.author"
                                            placeholder="可选"
                                        />
                                    </div>
                                </div>
                                <div class="grid gap-2">
                                    <Label for="gmm-pack-description">
                                        描述
                                    </Label>
                                    <Textarea
                                        id="gmm-pack-description"
                                        v-model="exportForm.description"
                                        class="min-h-28"
                                        placeholder="可选，用于描述本次打包内容"
                                    />
                                </div>

                                <Separator />

                                <div class="grid gap-4">
                                    <div class="space-y-2">
                                        <Label for="gmm-export-search">
                                            选择导出内容
                                        </Label>
                                        <Input
                                            id="gmm-export-search"
                                            v-model="exportSearch"
                                            placeholder="搜索名称、作者、版本、标签或类型"
                                        />
                                    </div>

                                    <div class="grid gap-3">
                                        <div class="flex flex-wrap gap-2">
                                            <Button
                                                :variant="
                                                    exportTypeFilter === 0
                                                        ? 'default'
                                                        : 'outline'
                                                "
                                                size="sm"
                                                @click="exportTypeFilter = 0"
                                            >
                                                全部类型 ({{
                                                    getExportTypeCount(0)
                                                }})
                                            </Button>
                                            <Button
                                                v-for="item in manager.availableTypes"
                                                :key="item.id"
                                                :variant="
                                                    exportTypeFilter === item.id
                                                        ? 'default'
                                                        : 'outline'
                                                "
                                                size="sm"
                                                @click="
                                                    exportTypeFilter = item.id
                                                "
                                            >
                                                {{ item.name }} ({{
                                                    getExportTypeCount(item.id)
                                                }})
                                            </Button>
                                        </div>

                                        <div class="flex flex-wrap gap-2">
                                            <Button
                                                :variant="
                                                    exportTagFilter === '全部'
                                                        ? 'default'
                                                        : 'outline'
                                                "
                                                size="sm"
                                                @click="exportTagFilter = '全部'"
                                            >
                                                全部标签 ({{
                                                    getExportTagCount("全部")
                                                }})
                                            </Button>
                                            <Button
                                                v-for="tag in manager.tags"
                                                :key="tag.name"
                                                :variant="
                                                    exportTagFilter === tag.name
                                                        ? 'default'
                                                        : 'outline'
                                                "
                                                size="sm"
                                                @click="
                                                    exportTagFilter = tag.name
                                                "
                                            >
                                                {{ tag.name }} ({{
                                                    getExportTagCount(tag.name)
                                                }})
                                            </Button>
                                        </div>
                                    </div>

                                    <div
                                        class="flex flex-wrap items-center justify-between gap-3"
                                    >
                                        <div class="flex flex-wrap gap-2">
                                            <Badge variant="secondary">
                                                已选 {{ exportSelectedCount }} 项
                                            </Badge>
                                            <Badge variant="outline">
                                                当前筛选 {{ exportFilteredMods.length }}
                                                项
                                            </Badge>
                                        </div>
                                        <div class="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                @click="selectAllFilteredExportMods"
                                            >
                                                全选当前筛选结果
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                @click="clearExportSelection"
                                            >
                                                清空选择
                                            </Button>
                                        </div>
                                    </div>

                                    <div
                                        v-if="exportFilteredMods.length === 0"
                                        class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
                                    >
                                        当前筛选条件下没有匹配的 Mod。
                                    </div>

                                    <div
                                        v-else
                                        class="grid max-h-96 gap-3 overflow-auto pr-1"
                                    >
                                        <label
                                            v-for="mod in exportFilteredMods"
                                            :key="mod.id"
                                            class="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-muted/40"
                                        >
                                            <input
                                                class="mt-1 h-4 w-4 accent-primary"
                                                type="checkbox"
                                                :checked="
                                                    selectedExportIds.includes(
                                                        mod.id,
                                                    )
                                                "
                                                :disabled="exportCreating"
                                                @change="
                                                    handleExportSelectionChange(
                                                        mod.id,
                                                        $event,
                                                    )
                                                "
                                            />
                                            <div class="min-w-0 flex-1 space-y-2">
                                                <div
                                                    class="flex flex-wrap items-center gap-2 text-sm"
                                                >
                                                    <span
                                                        class="font-medium text-foreground"
                                                    >
                                                        {{ mod.modName }}
                                                    </span>
                                                    <Badge variant="outline">
                                                        v{{ mod.modVersion }}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        {{
                                                            manager.getTypeName(
                                                                mod.modType,
                                                            )
                                                        }}
                                                    </Badge>
                                                    <Badge
                                                        :variant="
                                                            mod.isInstalled
                                                                ? 'secondary'
                                                                : 'outline'
                                                        "
                                                    >
                                                        {{
                                                            mod.isInstalled
                                                                ? "已安装"
                                                                : "未安装"
                                                        }}
                                                    </Badge>
                                                </div>
                                                <div
                                                    class="flex flex-wrap gap-3 text-xs text-muted-foreground"
                                                >
                                                    <span>
                                                        作者：{{
                                                            mod.modAuthor ||
                                                            "未填写"
                                                        }}
                                                    </span>
                                                    <span>
                                                        文件名：{{
                                                            mod.fileName
                                                        }}
                                                    </span>
                                                </div>
                                                <div
                                                    v-if="
                                                        (mod.tags ?? []).length >
                                                        0
                                                    "
                                                    class="flex flex-wrap gap-2"
                                                >
                                                    <Badge
                                                        v-for="tag in mod.tags"
                                                        :key="tag.name"
                                                        variant="outline"
                                                    >
                                                        {{ tag.name }}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle class="text-base">
                                    打包概览
                                </CardTitle>
                            </CardHeader>
                            <CardContent class="grid gap-3 text-sm">
                                <div
                                    class="flex items-center justify-between rounded-lg border px-3 py-2"
                                >
                                    <span class="text-muted-foreground">
                                        已选 Mod
                                    </span>
                                    <span class="font-medium">
                                        {{ exportSelectedCount }} 项
                                    </span>
                                </div>
                                <div
                                    class="flex items-center justify-between rounded-lg border px-3 py-2"
                                >
                                    <span class="text-muted-foreground">
                                        当前游戏
                                    </span>
                                    <span class="font-medium">
                                        {{
                                            manager.managerGame?.gameShowName ||
                                            manager.managerGame?.gameName ||
                                            "未选择"
                                        }}
                                    </span>
                                </div>
                                <div
                                    class="flex items-center justify-between rounded-lg border px-3 py-2"
                                >
                                    <span class="text-muted-foreground">
                                        目标格式
                                    </span>
                                    <span class="font-medium">*.gmm</span>
                                </div>
                                <p
                                    class="rounded-lg border bg-muted/30 px-3 py-2 leading-6 text-muted-foreground"
                                >
                                    打包时会复制当前弹窗中勾选的 Mod
                                    的本地缓存目录，并自动生成 info.json。
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </template>

                <template v-else-if="dialogStep === 2">
                    <div class="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                            即将打包 {{ exportSelectedCount }} 项
                        </Badge>
                        <Badge variant="outline">
                            包名：{{ exportForm.name || "未填写" }}
                        </Badge>
                        <Badge variant="outline">
                            版本：{{ exportForm.version || "未填写" }}
                        </Badge>
                    </div>

                    <div
                        v-if="exportSelectedMods.length === 0"
                        class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                        当前没有已选中的 Mod。
                    </div>

                    <div v-else class="grid gap-3 pr-1">
                        <div
                            v-for="mod in exportSelectedMods"
                            :key="mod.id"
                            class="rounded-xl border px-4 py-3"
                        >
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-medium text-foreground">
                                    {{ mod.modName }}
                                </span>
                                <Badge variant="outline">
                                    v{{ mod.modVersion }}
                                </Badge>
                                <Badge
                                    :variant="
                                        mod.isInstalled
                                            ? 'secondary'
                                            : 'outline'
                                    "
                                >
                                    {{ mod.isInstalled ? "已安装" : "未安装" }}
                                </Badge>
                            </div>
                            <div
                                class="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"
                            >
                                <span
                                    >作者：{{ mod.modAuthor || "未填写" }}</span
                                >
                                <span>
                                    类型：{{ manager.getTypeName(mod.modType) }}
                                </span>
                                <span>文件名：{{ mod.fileName }}</span>
                            </div>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <div
                        v-if="exportCreating"
                        class="flex min-h-56 items-center justify-center rounded-lg border border-dashed"
                    >
                        <div
                            class="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                            <LoaderCircle class="h-4 w-4 animate-spin" />
                            正在生成 GMM 包…
                        </div>
                    </div>

                    <div
                        v-else-if="exportError"
                        class="grid gap-4 rounded-xl border border-destructive/30 bg-destructive/6 p-4"
                    >
                        <div class="flex items-center gap-2 text-destructive">
                            <RefreshCw class="h-4 w-4" />
                            打包失败
                        </div>
                        <p class="text-sm leading-6 text-destructive">
                            {{ exportError }}
                        </p>
                    </div>

                    <Card v-else-if="exportResult">
                        <CardHeader>
                            <CardTitle class="flex items-center gap-2">
                                <Check class="h-4 w-4 text-green-600" />
                                打包完成
                            </CardTitle>
                            <CardDescription>
                                已生成 {{ exportResult.fileName }}
                            </CardDescription>
                        </CardHeader>
                        <CardContent class="grid gap-3 text-sm">
                            <div
                                class="flex items-center justify-between rounded-lg border px-3 py-2"
                            >
                                <span class="text-muted-foreground">
                                    打包数量
                                </span>
                                <span class="font-medium">
                                    {{ exportResult.packCount }} 项
                                </span>
                            </div>
                            <div class="grid gap-2 rounded-lg border px-3 py-2">
                                <span class="text-muted-foreground">
                                    输出路径
                                </span>
                                <span class="break-all">
                                    {{ exportResult.outputPath }}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </template>
            </div>

            <DialogFooter
                class="flex flex-wrap justify-between gap-2 sm:justify-between"
            >
                <Button
                    variant="outline"
                    :disabled="dialogStep === 1 || isBusy"
                    @click="prevStep"
                >
                    上一步
                </Button>

                <div class="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        :disabled="isBusy"
                        @click="closeDialog"
                    >
                        {{ dialogStep === 3 ? "关闭" : "取消" }}
                    </Button>

                    <Button
                        v-if="dialogStep < 3"
                        :disabled="
                             dialogMode === 'import'
                                 ? dialogStep === 2 && !canStartImport
                                 : dialogStep === 2 && !canStartExport
                         "
                        @click="
                             dialogMode === 'import'
                                ? nextImportStep()
                                : nextExportStep()
                        "
                    >
                        {{
                            dialogMode === "import"
                                ? dialogStep === 1
                                    ? "下一步"
                                    : "开始安装"
                                : dialogStep === 1
                                  ? "下一步"
                                  : "开始打包"
                        }}
                    </Button>

                    <Button
                        v-else-if="
                            (dialogMode === 'import' && importError) ||
                            (dialogMode === 'export' && exportError)
                        "
                        :disabled="isBusy"
                        @click="retryCurrentAction"
                    >
                        重试
                    </Button>

                    <Button v-else :disabled="isBusy" @click="closeDialog">
                        完成
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
