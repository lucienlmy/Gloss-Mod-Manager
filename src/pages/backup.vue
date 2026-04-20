<script setup lang="ts">
import { dirname, join } from "@tauri-apps/api/path";
import { storeToRefs } from "pinia";
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { Archive } from "lucide-vue-next";
import { ElMessage } from "element-plus-message";
import BackupTreeNode from "@/components/BackupTreeNode.vue";
import { FileHandler } from "@/lib/FileHandler";
import { SevenZip } from "@/lib/sevenZip";
import { useManager } from "@/stores/manager";
import { useSettings } from "@/stores/settings";

type BackupScopeKey = "archive" | "game";

interface IBackupSectionState {
    key: BackupScopeKey;
    title: string;
    description: string;
    sourceLabel: string;
    missingText: string;
    emptyText: string;
    sourcePath: string;
    sourceExists: boolean;
    backupPath: string;
    tree: IBackupTreeNode[];
    allFileKeys: string[];
    selectedKeys: string[];
    backups: IArchive[];
    loading: boolean;
    actionLoading: boolean;
}

interface ICreateDialogState {
    open: boolean;
    scopeKey: BackupScopeKey | null;
    name: string;
}

interface IRenameState {
    scopeKey: BackupScopeKey | null;
    zipFile: string;
    name: string;
}

interface IFileDetailDialogState {
    open: boolean;
    scopeKey: BackupScopeKey | null;
    zipFile: string;
}

const manager = useManager();
const settings = useSettings();
const router = useRouter();

const { managerGame } = storeToRefs(manager);
const { storagePath } = storeToRefs(settings);

const textCollator = new Intl.Collator("zh-CN", {
    numeric: true,
    sensitivity: "base",
});

const sections = reactive<Record<BackupScopeKey, IBackupSectionState>>({
    archive: {
        key: "archive",
        title: "存档备份",
        description: "备份当前游戏的存档目录，可用于快速恢复进度和配置。",
        sourceLabel: "存档目录",
        missingText: "当前游戏没有配置存档目录。",
        emptyText: "存档目录为空，暂时没有可备份的文件。",
        sourcePath: "",
        sourceExists: false,
        backupPath: "",
        tree: [],
        allFileKeys: [],
        selectedKeys: [],
        backups: [],
        loading: false,
        actionLoading: false,
    },
    game: {
        key: "game",
        title: "游戏目录备份",
        description:
            "按需备份当前游戏目录中的文件，适合保留原版文件或关键配置。",
        sourceLabel: "游戏目录",
        missingText: "当前游戏没有可用的游戏目录。",
        emptyText: "游戏目录为空，暂时没有可备份的文件。",
        sourcePath: "",
        sourceExists: false,
        backupPath: "",
        tree: [],
        allFileKeys: [],
        selectedKeys: [],
        backups: [],
        loading: false,
        actionLoading: false,
    },
});

const createDialog = reactive<ICreateDialogState>({
    open: false,
    scopeKey: null,
    name: "",
});

const renameState = reactive<IRenameState>({
    scopeKey: null,
    zipFile: "",
    name: "",
});

const fileDetailDialog = reactive<IFileDetailDialogState>({
    open: false,
    scopeKey: null,
    zipFile: "",
});

const gameLabel = computed(
    () => managerGame.value?.gameShowName ?? managerGame.value?.gameName ?? "",
);

const allSections = [sections.archive, sections.game];

const showArchiveBackup = computed(() =>
    Boolean(managerGame.value?.archivePath?.trim()),
);

const sectionList = computed(() =>
    showArchiveBackup.value ? allSections : [sections.game],
);

const watchToken = computed(() =>
    [
        managerGame.value?.GlossGameId ?? "",
        managerGame.value?.gameName ?? "",
        managerGame.value?.gamePath ?? "",
        managerGame.value?.archivePath ?? "",
        storagePath.value ?? "",
    ].join("::"),
);

const activeCreateSection = computed(() => {
    if (!createDialog.scopeKey) {
        return null;
    }

    return sections[createDialog.scopeKey];
});

const activeFileDetailSection = computed(() => {
    if (!fileDetailDialog.scopeKey) {
        return null;
    }

    return sections[fileDetailDialog.scopeKey];
});

const activeFileDetailBackup = computed(() => {
    if (!fileDetailDialog.scopeKey || !fileDetailDialog.zipFile) {
        return null;
    }

    return (
        sections[fileDetailDialog.scopeKey].backups.find(
            (item) => item.zipFile === fileDetailDialog.zipFile,
        ) ?? null
    );
});

const pageLoading = computed(() =>
    sectionList.value.some((section) => section.loading),
);

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
}

function compareText(left: string, right: string) {
    return textCollator.compare(left, right);
}

function sortTreeNodes(nodes: IBackupTreeNode[]): IBackupTreeNode[] {
    return nodes
        .map((node) => ({
            ...node,
            children: node.children ? sortTreeNodes(node.children) : undefined,
        }))
        .sort((left, right) => {
            if (left.isDirectory !== right.isDirectory) {
                return left.isDirectory ? -1 : 1;
            }

            return compareText(left.label, right.label);
        });
}

function collectLeafPaths(node: IBackupTreeNode): string[] {
    if (!node.isDirectory || !node.children?.length) {
        return [node.relativePath];
    }

    return node.children.flatMap((child) => collectLeafPaths(child));
}

function collectTreeLeafPaths(tree: IBackupTreeNode[]) {
    return tree.flatMap((node) => collectLeafPaths(node));
}

function normalizeArchiveList(raw: unknown): IArchive[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw
        .filter((item): item is IArchive => {
            if (!item || typeof item !== "object") {
                return false;
            }

            const archive = item as Partial<IArchive>;

            return (
                typeof archive.name === "string" &&
                typeof archive.zipFile === "string" &&
                Array.isArray(archive.files) &&
                typeof archive.size === "number" &&
                typeof archive.time === "number"
            );
        })
        .map((item) => ({
            ...item,
            files: [...item.files].sort((left, right) =>
                compareText(left, right),
            ),
        }))
        .sort((left, right) => right.time - left.time);
}

async function getBackupJsonPath(backupPath: string) {
    return join(backupPath, "backup.json");
}

async function readBackupList(backupPath: string): Promise<IArchive[]> {
    if (!backupPath) {
        return [];
    }

    const backupJsonPath = await getBackupJsonPath(backupPath);

    if (!(await FileHandler.fileExists(backupJsonPath))) {
        return [];
    }

    const raw = await FileHandler.readFileSync(backupJsonPath, "[]");

    return normalizeArchiveList(JSON.parse(raw));
}

async function saveBackupList(scopeKey: BackupScopeKey) {
    const section = sections[scopeKey];

    if (!section.backupPath) {
        return;
    }

    const backupJsonPath = await getBackupJsonPath(section.backupPath);
    const saved = await FileHandler.writeFile(
        backupJsonPath,
        JSON.stringify(section.backups, null, 4),
    );

    if (!saved) {
        throw new Error(`写入备份清单失败：${backupJsonPath}`);
    }
}

async function buildBackupTree(rootPath: string): Promise<IBackupTreeNode[]> {
    const files = await FileHandler.getAllFilesInFolder(rootPath, true, true);
    const uniqueFiles = [...new Set(files)].sort((left, right) =>
        compareText(left, right),
    );
    const rootNodes: IBackupTreeNode[] = [];

    for (const absolutePath of uniqueFiles) {
        const relativePath = FileHandler.normalizePath(
            await FileHandler.relativePath(rootPath, absolutePath),
        );

        if (!relativePath) {
            continue;
        }

        const separator = relativePath.includes("\\") ? "\\" : "/";
        const segments = relativePath.split(/[\\/]+/u).filter(Boolean);

        if (segments.length === 0) {
            continue;
        }

        let currentLevel = rootNodes;

        for (const [index, segment] of segments.entries()) {
            const isDirectory = index < segments.length - 1;
            const nodePath = segments.slice(0, index + 1).join(separator);
            let currentNode = currentLevel.find(
                (item) => item.relativePath === nodePath,
            );

            if (!currentNode) {
                currentNode = {
                    label: segment,
                    relativePath: nodePath,
                    isDirectory,
                    children: isDirectory ? [] : undefined,
                };
                currentLevel.push(currentNode);
            }

            if (isDirectory) {
                currentLevel = currentNode.children ?? [];
                currentNode.children = currentLevel;
            }
        }
    }

    return sortTreeNodes(rootNodes);
}

async function resolveBackupPath(scopeKey: BackupScopeKey) {
    if (!storagePath.value || !managerGame.value?.gameName) {
        return "";
    }

    return join(
        storagePath.value,
        "~Backup",
        scopeKey === "archive" ? "Archive" : "Game",
        managerGame.value.gameName,
    );
}

function resolveSourcePath(scopeKey: BackupScopeKey) {
    if (scopeKey === "archive") {
        return managerGame.value?.archivePath ?? "";
    }

    return managerGame.value?.gamePath ?? "";
}

async function refreshScope(scopeKey: BackupScopeKey) {
    const section = sections[scopeKey];
    section.loading = true;

    try {
        section.sourcePath = resolveSourcePath(scopeKey);
        section.backupPath = await resolveBackupPath(scopeKey);
        section.selectedKeys = [];
        section.backups = await readBackupList(section.backupPath);

        if (!section.sourcePath) {
            section.sourceExists = false;
            section.tree = [];
            section.allFileKeys = [];
            return;
        }

        section.sourceExists = await FileHandler.fileExists(section.sourcePath);

        if (!section.sourceExists) {
            section.tree = [];
            section.allFileKeys = [];
            return;
        }

        section.tree = await buildBackupTree(section.sourcePath);
        section.allFileKeys = collectTreeLeafPaths(section.tree);
    } catch (error: unknown) {
        section.tree = [];
        section.allFileKeys = [];
        section.selectedKeys = [];
        ElMessage.error(getErrorMessage(error, `读取${section.title}失败。`));
        console.error(`读取 ${section.title} 失败`);
        console.error(error);
    } finally {
        section.loading = false;
    }
}

async function refreshAll() {
    if (!managerGame.value) {
        for (const section of allSections) {
            section.sourcePath = "";
            section.sourceExists = false;
            section.backupPath = "";
            section.tree = [];
            section.allFileKeys = [];
            section.selectedKeys = [];
            section.backups = [];
            section.loading = false;
            section.actionLoading = false;
        }

        createDialog.open = false;
        renameState.scopeKey = null;
        renameState.zipFile = "";
        renameState.name = "";
        return;
    }

    await Promise.all([refreshScope("archive"), refreshScope("game")]);
}

function selectAll(scopeKey: BackupScopeKey) {
    const section = sections[scopeKey];
    section.selectedKeys = [...section.allFileKeys];
}

function reverseSelect(scopeKey: BackupScopeKey) {
    const section = sections[scopeKey];
    const selectedSet = new Set(section.selectedKeys);

    section.selectedKeys = section.allFileKeys.filter(
        (item) => !selectedSet.has(item),
    );
}

function toggleNode(
    scopeKey: BackupScopeKey,
    node: IBackupTreeNode,
    checked: boolean,
) {
    const section = sections[scopeKey];
    const changedKeys = collectLeafPaths(node);
    const selectedSet = new Set(section.selectedKeys);

    for (const item of changedKeys) {
        if (checked) {
            selectedSet.add(item);
        } else {
            selectedSet.delete(item);
        }
    }

    section.selectedKeys = [...selectedSet].sort((left, right) =>
        compareText(left, right),
    );
}

async function openFolder(folderPath: string, createIfMissing = false) {
    if (!folderPath) {
        ElMessage.warning("当前路径不可用。");
        return;
    }

    if (!(await FileHandler.fileExists(folderPath))) {
        if (!createIfMissing) {
            ElMessage.warning("目标目录不存在。");
            return;
        }

        await FileHandler.createDirectory(folderPath);
    }

    await FileHandler.openFolder(folderPath);
}

async function openSourceFolder(scopeKey: BackupScopeKey) {
    const section = sections[scopeKey];
    await openFolder(section.sourcePath, false);
}

async function openBackupFolder(scopeKey: BackupScopeKey) {
    const section = sections[scopeKey];
    await openFolder(section.backupPath, true);
}

function formatSize(size: number) {
    if (!Number.isFinite(size) || size <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = size;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const digits = value >= 10 || unitIndex === 0 ? 0 : 1;

    return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

function formatTime(time: number) {
    return new Date(time).toLocaleString("zh-CN");
}

function openCreateDialog(scopeKey: BackupScopeKey) {
    const section = sections[scopeKey];

    if (!section.selectedKeys.length) {
        ElMessage.warning(`请至少选择一个${section.sourceLabel}中的文件。`);
        return;
    }

    if (!section.backupPath) {
        ElMessage.warning("请先配置储存路径并选择游戏。");
        return;
    }

    createDialog.scopeKey = scopeKey;
    createDialog.name = "";
    createDialog.open = true;
}

function resetCreateDialog() {
    createDialog.open = false;
    createDialog.scopeKey = null;
    createDialog.name = "";
}

async function submitCreateBackup() {
    const scopeKey = createDialog.scopeKey;

    if (!scopeKey) {
        return;
    }

    const section = sections[scopeKey];
    const backupName = createDialog.name.trim();

    if (!backupName) {
        ElMessage.warning("请输入备份名称。");
        return;
    }

    if (
        section.backups.some((item) => compareText(item.name, backupName) === 0)
    ) {
        ElMessage.warning("备份名称已存在，请更换一个名称。");
        return;
    }

    section.actionLoading = true;

    try {
        await FileHandler.createDirectory(section.backupPath);
        const archivePath = await join(section.backupPath, `${Date.now()}.zip`);

        await SevenZip.createArchive({
            archivePath,
            sources: [...section.selectedKeys],
            format: "zip",
            cwd: section.sourcePath,
            overwriteMode: "overwrite",
            assumeYes: true,
        });

        const archiveInfo: IArchive = {
            name: backupName,
            zipFile: archivePath,
            files: [...section.selectedKeys],
            size: await FileHandler.getFileSize(archivePath),
            time: Date.now(),
        };

        section.backups = [archiveInfo, ...section.backups].sort(
            (left, right) => right.time - left.time,
        );
        await saveBackupList(scopeKey);
        resetCreateDialog();
        ElMessage.success("备份已创建。");
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error, "创建备份失败。"));
        console.error(`创建 ${section.title} 失败`);
        console.error(error);
    } finally {
        section.actionLoading = false;
    }
}

function startRename(scopeKey: BackupScopeKey, item: IArchive) {
    renameState.scopeKey = scopeKey;
    renameState.zipFile = item.zipFile;
    renameState.name = item.name;
}

function cancelRename() {
    renameState.scopeKey = null;
    renameState.zipFile = "";
    renameState.name = "";
}

function openFileDetailDialog(scopeKey: BackupScopeKey, item: IArchive) {
    fileDetailDialog.scopeKey = scopeKey;
    fileDetailDialog.zipFile = item.zipFile;
    fileDetailDialog.open = true;
}

function resetFileDetailDialog() {
    fileDetailDialog.open = false;
    fileDetailDialog.scopeKey = null;
    fileDetailDialog.zipFile = "";
}

async function saveBackupName(scopeKey: BackupScopeKey, item: IArchive) {
    const section = sections[scopeKey];
    const nextName = renameState.name.trim();

    if (!nextName) {
        ElMessage.warning("备份名称不能为空。");
        return;
    }

    if (
        section.backups.some(
            (archive) =>
                archive.zipFile !== item.zipFile &&
                compareText(archive.name, nextName) === 0,
        )
    ) {
        ElMessage.warning("备份名称已存在，请使用其他名称。");
        return;
    }

    section.actionLoading = true;

    try {
        section.backups = section.backups.map((archive) => {
            if (archive.zipFile !== item.zipFile) {
                return archive;
            }

            return {
                ...archive,
                name: nextName,
            };
        });

        await saveBackupList(scopeKey);
        cancelRename();
        ElMessage.success("备份名称已更新。");
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error, "更新备份名称失败。"));
        console.error(`更新 ${section.title} 名称失败`);
        console.error(error);
    } finally {
        section.actionLoading = false;
    }
}

async function deleteBackup(scopeKey: BackupScopeKey, item: IArchive) {
    const section = sections[scopeKey];
    const confirmed = window.confirm(
        `确定删除备份“${item.name}”吗？此操作会同时删除压缩包文件。`,
    );

    if (!confirmed) {
        return;
    }

    section.actionLoading = true;

    try {
        const deleted = await FileHandler.deleteFile(item.zipFile);

        if (!deleted) {
            throw new Error(`删除备份文件失败：${item.zipFile}`);
        }

        section.backups = section.backups.filter(
            (archive) => archive.zipFile !== item.zipFile,
        );
        await saveBackupList(scopeKey);
        if (renameState.zipFile === item.zipFile) {
            cancelRename();
        }
        if (fileDetailDialog.zipFile === item.zipFile) {
            resetFileDetailDialog();
        }
        ElMessage.success("备份已删除。");
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error, "删除备份失败。"));
        console.error(`删除 ${section.title} 失败`);
        console.error(error);
    } finally {
        section.actionLoading = false;
    }
}

async function restoreBackup(scopeKey: BackupScopeKey, item: IArchive) {
    const section = sections[scopeKey];

    if (!section.sourcePath) {
        ElMessage.warning(section.missingText);
        return;
    }

    const confirmed = window.confirm(
        `确定将备份“${item.name}”恢复到${section.sourceLabel}吗？\n\n同名文件会被覆盖。`,
    );

    if (!confirmed) {
        return;
    }

    section.actionLoading = true;

    try {
        if (!(await FileHandler.fileExists(item.zipFile))) {
            throw new Error(`备份压缩包不存在，无法恢复：${item.zipFile}`);
        }

        await FileHandler.createDirectory(section.sourcePath);
        await SevenZip.extractArchive({
            archivePath: item.zipFile,
            outputDirectory: section.sourcePath,
            overwriteMode: "overwrite",
            assumeYes: true,
        });

        await refreshScope(scopeKey);
        ElMessage.success("备份已恢复。");
    } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error, "恢复备份失败。"));
        console.error(`恢复 ${section.title} 失败`);
        console.error(error);
    } finally {
        section.actionLoading = false;
    }
}

async function openBackupLocation(zipFile: string) {
    const folderPath = await dirname(zipFile);
    await openFolder(folderPath, false);
}

watch(
    watchToken,
    async () => {
        await refreshAll();
    },
    { immediate: true },
);

watch(
    () => createDialog.open,
    (open) => {
        if (!open) {
            resetCreateDialog();
        }
    },
);

watch(
    () => fileDetailDialog.open,
    (open) => {
        if (!open) {
            resetFileDetailDialog();
        }
    },
);

watch(showArchiveBackup, (visible) => {
    if (visible) {
        return;
    }

    if (createDialog.scopeKey === "archive") {
        resetCreateDialog();
    }

    if (renameState.scopeKey === "archive") {
        cancelRename();
    }

    if (fileDetailDialog.scopeKey === "archive") {
        resetFileDetailDialog();
    }
});
</script>

<template>
    <div class="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="space-y-2">
                        <CardTitle class="flex items-center gap-3 text-xl">
                            <Archive class="h-5 w-5" />
                            备份
                        </CardTitle>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            :disabled="pageLoading || !managerGame"
                            @click="refreshAll"
                        >
                            刷新页面
                        </Button>

                        <!-- <Button
                            variant="secondary"
                            @click="router.push('/games')"
                        >
                            选择游戏
                        </Button> -->
                    </div>
                </div>
            </CardHeader>

            <CardContent class="flex flex-col gap-3">
                <template v-if="managerGame">
                    <div class="flex flex-wrap gap-2">
                        <Badge variant="secondary"
                            >当前游戏：{{ gameLabel }}</Badge
                        >
                        <Badge variant="outline">
                            储存路径：{{ storagePath || "未设置" }}
                        </Badge>
                        <Badge variant="outline">
                            游戏目录：{{ managerGame.gamePath || "未检测到" }}
                        </Badge>
                        <Badge variant="outline">
                            存档目录：{{ managerGame.archivePath || "未配置" }}
                        </Badge>
                    </div>
                </template>

                <div v-else class="flex flex-wrap gap-2">
                    <Button @click="router.push('/games')">前往游戏页</Button>
                    <Button variant="outline" @click="router.push('/manager')">
                        前往管理页
                    </Button>
                </div>
            </CardContent>
        </Card>

        <template v-if="managerGame">
            <Card v-for="section in sectionList" :key="section.key">
                <CardHeader>
                    <div
                        class="flex flex-wrap items-start justify-between gap-4"
                    >
                        <div class="space-y-2">
                            <CardTitle>{{ section.title }}</CardTitle>
                            <CardDescription>
                                {{ section.description }}
                            </CardDescription>
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="
                                    section.loading || section.actionLoading
                                "
                                @click="refreshScope(section.key)"
                            >
                                刷新
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="!section.sourcePath"
                                @click="openSourceFolder(section.key)"
                            >
                                打开{{ section.sourceLabel }}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="!section.backupPath"
                                @click="openBackupFolder(section.key)"
                            >
                                打开备份目录
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent
                    class="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
                >
                    <Card>
                        <CardHeader>
                            <div
                                class="flex flex-wrap items-start justify-between gap-4"
                            >
                                <div class="space-y-2">
                                    <CardTitle class="text-base"
                                        >待备份内容</CardTitle
                                    >
                                    <CardDescription>
                                        已选择
                                        {{ section.selectedKeys.length }} /
                                        {{ section.allFileKeys.length }} 个文件
                                    </CardDescription>
                                </div>

                                <div class="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        :disabled="!section.allFileKeys.length"
                                        @click="selectAll(section.key)"
                                    >
                                        全选
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        :disabled="!section.allFileKeys.length"
                                        @click="reverseSelect(section.key)"
                                    >
                                        反选
                                    </Button>
                                    <Button
                                        size="sm"
                                        :disabled="
                                            !section.selectedKeys.length ||
                                            section.actionLoading
                                        "
                                        @click="openCreateDialog(section.key)"
                                    >
                                        创建备份
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div
                                v-if="section.loading"
                                class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground"
                            >
                                正在读取{{ section.sourceLabel }}...
                            </div>

                            <div
                                v-else-if="!section.sourcePath"
                                class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground"
                            >
                                {{ section.missingText }}
                            </div>

                            <div
                                v-else-if="!section.sourceExists"
                                class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground"
                            >
                                {{
                                    section.sourceLabel
                                }}不存在，可能尚未生成或当前路径不可访问。
                            </div>

                            <div
                                v-else-if="!section.tree.length"
                                class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground"
                            >
                                {{ section.emptyText }}
                            </div>

                            <div
                                v-else
                                class="max-h-128 overflow-auto rounded-xl border border-border/60 bg-muted/15 p-3"
                            >
                                <div class="flex flex-col gap-2">
                                    <BackupTreeNode
                                        v-for="node in section.tree"
                                        :key="node.relativePath"
                                        :node="node"
                                        :selected-keys="section.selectedKeys"
                                        :disabled="section.actionLoading"
                                        @toggle="
                                            toggleNode(
                                                section.key,
                                                $event.node,
                                                $event.checked,
                                            )
                                        "
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div
                                class="flex flex-wrap items-start justify-between gap-4"
                            >
                                <div class="space-y-2">
                                    <CardTitle class="text-base"
                                        >备份列表</CardTitle
                                    >
                                    <CardDescription>
                                        共
                                        {{ section.backups.length }} 条备份记录
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div
                                v-if="!section.backups.length"
                                class="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground"
                            >
                                暂无备份
                            </div>

                            <div
                                v-else
                                class="flex max-h-128 flex-col gap-3 overflow-auto pr-1"
                            >
                                <div
                                    v-for="item in section.backups"
                                    :key="item.zipFile"
                                    class="rounded-xl border border-border/60 bg-card/90 p-4"
                                >
                                    <div
                                        class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"
                                    >
                                        <div class="min-w-0 flex-1 space-y-3">
                                            <div
                                                v-if="
                                                    renameState.scopeKey ===
                                                        section.key &&
                                                    renameState.zipFile ===
                                                        item.zipFile
                                                "
                                                class="flex flex-col gap-2"
                                            >
                                                <Input
                                                    v-model="renameState.name"
                                                    placeholder="输入新的备份名称"
                                                    @keydown.enter="
                                                        saveBackupName(
                                                            section.key,
                                                            item,
                                                        )
                                                    "
                                                    @keydown.esc="cancelRename"
                                                />
                                                <div
                                                    class="flex flex-wrap gap-2"
                                                >
                                                    <Button
                                                        size="sm"
                                                        :disabled="
                                                            section.actionLoading ||
                                                            !renameState.name.trim()
                                                        "
                                                        @click="
                                                            saveBackupName(
                                                                section.key,
                                                                item,
                                                            )
                                                        "
                                                    >
                                                        保存
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        @click="cancelRename"
                                                    >
                                                        取消
                                                    </Button>
                                                </div>
                                            </div>

                                            <button
                                                v-else
                                                type="button"
                                                class="text-left text-sm font-semibold hover:text-primary"
                                                @dblclick="
                                                    startRename(
                                                        section.key,
                                                        item,
                                                    )
                                                "
                                            >
                                                {{ item.name }}
                                            </button>

                                            <div
                                                class="flex flex-wrap gap-2 text-xs text-muted-foreground"
                                            >
                                                <Badge variant="secondary">
                                                    {{ formatTime(item.time) }}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {{ formatSize(item.size) }}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {{ item.files.length }}
                                                    个文件
                                                </Badge>
                                            </div>
                                        </div>

                                        <div class="flex flex-wrap gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger as-child>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <IconEllipsis
                                                            class="h-4 w-4"
                                                        />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="start"
                                                >
                                                    <DropdownMenuItem
                                                        :disabled="
                                                            section.actionLoading
                                                        "
                                                        @click="
                                                            openFileDetailDialog(
                                                                section.key,
                                                                item,
                                                            )
                                                        "
                                                    >
                                                        查看文件
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        :disabled="
                                                            section.actionLoading
                                                        "
                                                        @click="
                                                            startRename(
                                                                section.key,
                                                                item,
                                                            )
                                                        "
                                                    >
                                                        重命名
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        :disabled="
                                                            section.actionLoading
                                                        "
                                                        @click="
                                                            restoreBackup(
                                                                section.key,
                                                                item,
                                                            )
                                                        "
                                                    >
                                                        恢复
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        :disabled="
                                                            section.actionLoading
                                                        "
                                                        @click="
                                                            openBackupLocation(
                                                                item.zipFile,
                                                            )
                                                        "
                                                    >
                                                        定位
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        class="text-destructive hover:text-destructive"
                                                        :disabled="
                                                            section.actionLoading
                                                        "
                                                        @click="
                                                            deleteBackup(
                                                                section.key,
                                                                item,
                                                            )
                                                        "
                                                    >
                                                        删除
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </template>

        <Dialog v-model:open="createDialog.open" modal>
            <DialogContent class="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        创建{{ activeCreateSection?.title || "备份" }}
                    </DialogTitle>
                    <DialogDescription>
                        压缩选中的文件并写入备份清单，后续可以直接恢复到原目录。
                    </DialogDescription>
                </DialogHeader>

                <div class="flex flex-col gap-3">
                    <Label for="backup-name">备份名称</Label>
                    <Input
                        id="backup-name"
                        v-model="createDialog.name"
                        placeholder="例如：更新前配置"
                        @keydown.enter="submitCreateBackup"
                    />
                    <div
                        class="rounded-lg bg-muted/35 p-3 text-sm text-muted-foreground"
                    >
                        将创建
                        {{ activeCreateSection?.selectedKeys.length || 0 }}
                        个文件的压缩备份。
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" @click="resetCreateDialog"
                        >取消</Button
                    >
                    <Button
                        :disabled="
                            !createDialog.name.trim() ||
                            activeCreateSection?.actionLoading
                        "
                        @click="submitCreateBackup"
                    >
                        创建
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog v-model:open="fileDetailDialog.open" modal>
            <DialogContent class="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {{ activeFileDetailBackup?.name || "备份文件明细" }}
                    </DialogTitle>
                    <DialogDescription>
                        查看当前备份压缩包中记录的文件列表。
                    </DialogDescription>
                </DialogHeader>

                <div v-if="activeFileDetailBackup" class="flex flex-col gap-3">
                    <div
                        class="flex flex-wrap gap-2 text-xs text-muted-foreground"
                    >
                        <Badge variant="secondary">
                            {{ activeFileDetailSection?.title || "备份" }}
                        </Badge>
                        <Badge variant="outline">
                            {{ formatTime(activeFileDetailBackup.time) }}
                        </Badge>
                        <Badge variant="outline">
                            {{ activeFileDetailBackup.files.length }} 个文件
                        </Badge>
                        <Badge variant="outline">
                            {{ formatSize(activeFileDetailBackup.size) }}
                        </Badge>
                    </div>

                    <p class="break-all text-xs text-muted-foreground">
                        {{ activeFileDetailBackup.zipFile }}
                    </p>

                    <div
                        class="max-h-128 overflow-auto rounded-lg border border-border/60 bg-muted/25 p-3"
                    >
                        <div
                            class="grid gap-2 font-mono text-xs text-muted-foreground"
                        >
                            <div
                                v-for="file in activeFileDetailBackup.files"
                                :key="`${activeFileDetailBackup.zipFile}-${file}`"
                                class="break-all rounded-md bg-background/60 px-2 py-1"
                            >
                                {{ file }}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" @click="resetFileDetailDialog">
                        关闭
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<style scoped></style>
