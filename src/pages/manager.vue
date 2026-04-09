<script setup lang="ts">
import { basename, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { ElMessage } from "element-plus-message";
import {
    FolderOpen,
    FolderPlus,
    Gamepad2,
    PencilLine,
    RefreshCw,
    Search,
    Settings2,
    Trash2,
} from "lucide-vue-next";

interface IBatchEditForm {
    modAuthor: string;
    modType: number | string | "";
    modVersion: string;
    modWebsite: string;
    tagsText: string;
}

const ARCHIVE_EXTENSIONS = ["zip", "7z", "rar", "tar", "gz", "xz", "bz2"];

const manager = useManager();
const router = useRouter();

const storagePath = PersistentStore.useValue<string>("storagePath", "");
const disableSymlinkInstall = PersistentStore.useValue<boolean>(
    "disableSymlinkInstall",
    false,
);

const managerRoot = ref("");
const loading = ref(false);
const importLoading = ref(false);
const loadError = ref("");
const search = ref("");
const selectedIds = ref<number[]>([]);
const actioningIds = ref<number[]>([]);
const tagName = ref("");
const tagColor = ref("#14F7D8");
const showTagEditDialog = ref(false);
const editingTagName = ref("");

const showBatchEditDialog = ref(false);
const batchEditForm = reactive<IBatchEditForm>({
    modAuthor: "",
    modType: "",
    modVersion: "",
    modWebsite: "",
    tagsText: "",
});

let latestLoadId = 0;

watch(manager.filteredMods, (mods) => {
    const visibleIds = new Set(mods.map((mod) => mod.id));
    selectedIds.value = selectedIds.value.filter((id) => visibleIds.has(id));
});

watch(
    [manager.managerGame, storagePath, disableSymlinkInstall],
    async () => {
        await syncManagerContext();
        await loadManagerData();
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

function stripArchiveExtension(fileName: string) {
    return fileName.replace(/\.(zip|7z|rar|tar|gz|xz|bz2)$/iu, "");
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
    if (!manager.managerGame || !storagePath.value) {
        managerRoot.value = "";
        Manager.configureContext({
            modStorage: "",
            gameStorage: manager.managerGame?.gamePath ?? "",
            closeSoftLinks: disableSymlinkInstall.value,
        });
        return;
    }

    managerRoot.value = await join(
        storagePath.value,
        "mods",
        manager.managerGame?.gameName ?? "",
    );
    Manager.configureContext({
        modStorage: managerRoot.value,
        gameStorage: manager.managerGame?.gamePath ?? "",
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
    selectedIds.value = [];

    if (!manager.managerGame) {
        manager.managerModList = [];
        manager.tags = [];
        return;
    }

    if (!storagePath.value || !managerRoot.value) {
        manager.managerModList = [];
        manager.tags = [];
        return;
    }

    loading.value = true;

    try {
        const storedMods = (await Manager.getModInfo(
            managerRoot.value,
        )) as IModInfo[];
        const storedTags = (await Manager.getModInfo(
            managerRoot.value,
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

async function saveManagerData() {
    if (!managerRoot.value) {
        return;
    }

    await Manager.saveModInfo(manager.managerModList, managerRoot.value);
    await Manager.saveModInfo(manager.tags, managerRoot.value, "tags.json");
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

    syncTagsFromMods();
    await saveManagerData();
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

function isActioning(modId: number) {
    return actioningIds.value.includes(modId);
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
        await saveManagerData();
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

async function openModRootFolder() {
    if (!managerRoot.value) {
        ElMessage.warning("请先配置储存路径并选择游戏。");
        return;
    }

    await FileHandler.openFolder(managerRoot.value);
}

async function openGameFolder() {
    if (!manager.managerGame?.gamePath) {
        ElMessage.warning("当前游戏还没有配置安装目录。");
        return;
    }

    await FileHandler.openFolder(manager.managerGame?.gamePath ?? "");
}

async function importModFolder() {
    if (!manager.managerGame || !managerRoot.value) {
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
    if (!manager.managerGame || !managerRoot.value) {
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
                extensions: ARCHIVE_EXTENSIONS,
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
    if (!managerRoot.value) {
        return;
    }

    importLoading.value = true;
    let nextId =
        manager.managerModList.reduce(
            (currentMax, mod) => Math.max(currentMax, Number(mod.id) || 0),
            0,
        ) + 1;
    let importedCount = 0;

    try {
        for (const source of sources) {
            const modId = nextId;
            nextId += 1;

            const targetFolder = await join(managerRoot.value, String(modId));
            await FileHandler.createDirectory(targetFolder);

            const imported =
                sourceType === "folder"
                    ? await FileHandler.copyFolder(source, targetFolder)
                    : await SevenZip.extractArchive({
                          archivePath: source,
                          outputDirectory: targetFolder,
                      }).then(() => true);

            if (!imported) {
                await Manager.deleteMod(targetFolder);
                continue;
            }

            const absoluteFiles = await FileHandler.getAllFilesInFolder(
                targetFolder,
                true,
                true,
            );

            if (absoluteFiles.length === 0) {
                await Manager.deleteMod(targetFolder);
                continue;
            }

            const modFiles = await Promise.all(
                absoluteFiles.map(
                    async (filePath) =>
                        await FileHandler.relativePath(targetFolder, filePath),
                ),
            );

            const originalName = await basename(source);
            const modName =
                sourceType === "archive"
                    ? stripArchiveExtension(originalName)
                    : originalName;

            const mod = normalizeMod({
                id: modId,
                modName,
                fileName: originalName,
                modFiles,
                modVersion: "1.0.0",
                modAuthor: "",
                modWebsite: "",
                isInstalled: false,
                weight: manager.managerModList.length + importedCount + 1,
                from: "Customize",
            });
            mod.modType = await detectModType(mod);
            manager.managerModList = [...manager.managerModList, mod];
            importedCount += 1;
        }

        syncTagsFromMods();
        await saveManagerData();
        ElMessage.success(
            importedCount > 0
                ? `成功导入 ${importedCount} 个 Mod。`
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

function resetTagEditor() {
    editingTagName.value = "";
    tagName.value = "";
    tagColor.value = "#14F7D8";
}

function openCreateTagDialog() {
    resetTagEditor();
}

function openEditTagDialog(tag: ITag) {
    editingTagName.value = tag.name;
    tagName.value = tag.name;
    tagColor.value = tag.color;
    showTagEditDialog.value = true;
}

async function submitTag() {
    const name = tagName.value.trim();

    if (!name) {
        ElMessage.warning("标签名称不能为空。");
        return;
    }

    if (
        manager.tags.some(
            (tag) => tag.name === name && tag.name !== editingTagName.value,
        )
    ) {
        ElMessage.warning("标签已存在。");
        return;
    }

    if (editingTagName.value) {
        manager.tags = dedupeTags(
            manager.tags.map((tag) => {
                if (tag.name !== editingTagName.value) {
                    return tag;
                }

                return {
                    name,
                    color: tagColor.value,
                };
            }),
        );

        manager.managerModList = manager.managerModList.map((mod) => ({
            ...mod,
            tags: dedupeTags(
                (mod.tags ?? []).map((tag) => {
                    if (tag.name !== editingTagName.value) {
                        return tag;
                    }

                    return {
                        name,
                        color: tagColor.value,
                    };
                }),
            ),
        }));

        if (manager.selectedTag === editingTagName.value) {
            manager.selectedTag = name;
        }

        await saveManagerData();
        ElMessage.success("标签已更新。");
    } else {
        manager.tags = dedupeTags([
            ...manager.tags,
            {
                name,
                color: tagColor.value,
            },
        ]);
        await saveManagerData();
        ElMessage.success("标签已添加。");
    }

    resetTagEditor();
    showTagEditDialog.value = false;
}

async function deleteTag(tag: ITag) {
    const confirmed = window.confirm(
        `确定删除标签 ${tag.name} 吗？这会同时把它从所有 Mod 上移除。`,
    );

    if (!confirmed) {
        return;
    }

    manager.tags = manager.tags.filter((item) => item.name !== tag.name);
    manager.managerModList = manager.managerModList.map((mod) => ({
        ...mod,
        tags: (mod.tags ?? []).filter((item) => item.name !== tag.name),
    }));

    if (manager.selectedTag === tag.name) {
        manager.selectedTag = "全部";
    }

    if (editingTagName.value === tag.name) {
        resetTagEditor();
        showTagEditDialog.value = false;
    }

    await saveManagerData();
    ElMessage.success("标签已删除。");
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
                        class="flex flex-wrap justify-between items-center gap-3">
                        <h3 class="text-2xl">Mod 管理</h3>
                        <div>
                            当前游戏『
                            {{
                                manager.managerGame.gameShowName ||
                                manager.managerGame.gameName
                            }}
                            』
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent class="flex flex-col gap-4">
                    <div class="flex flex-col">
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
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <StartGame :game="manager.managerGame" />
                            <Button variant="outline" @click="loadManagerData">
                                <RefreshCw class="h-4 w-4" />
                                刷新
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
                                        @click="openModRootFolder">
                                        <FolderOpen class="h-4 w-4" />
                                        打开 Mod 目录
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="openGameFolder">
                                        <FolderOpen class="h-4 w-4" />
                                        打开游戏目录
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div
                        class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                        <div class="relative">
                            <Search
                                class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                v-model="search"
                                class="pl-9"
                                placeholder="搜索名称、作者、版本、标签或类型" />
                        </div>
                        <Select v-model="manager.sortKey">
                            <SelectTrigger class="min-w-38">
                                <SelectValue placeholder="排序方式" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weight">默认排序</SelectItem>
                                <SelectItem value="name">按名称</SelectItem>
                                <SelectItem value="type">按类型</SelectItem>
                                <SelectItem value="author">按作者</SelectItem>
                                <SelectItem value="version">按版本</SelectItem>
                                <SelectItem value="state"
                                    >按安装状态</SelectItem
                                >
                                <SelectItem value="tag">按标签</SelectItem>
                            </SelectContent>
                        </Select>
                        <div
                            class="flex items-center gap-2 rounded-md border px-3 py-2">
                            <Label for="filter-installed">仅看已安装</Label>
                            <Switch
                                id="filter-installed"
                                v-model="manager.filterInstalled" />
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-sm">
                        <Button
                            :variant="
                                manager.selectedType === 0
                                    ? 'default'
                                    : 'outline'
                            "
                            size="sm"
                            @click="manager.selectedType = 0">
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
                            @click="manager.selectedType = item.id">
                            {{ item.name }} ({{ getTypeCount(item.id) }})
                        </Button>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                        <ToggleGroup
                            type="single"
                            v-model="manager.selectedTag">
                            <ToggleGroupItem value="全部">
                                全部标签
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                v-for="tag in manager.tags"
                                :key="tag.name"
                                :value="tag.name">
                                <ContextMenu>
                                    <ContextMenuTrigger
                                        class="flex items-center gap-2">
                                        <div
                                            class="h-2.5 w-2.5 rounded-full"
                                            :style="{
                                                backgroundColor: tag.color,
                                            }"></div>
                                        {{ tag.name }}
                                    </ContextMenuTrigger>
                                    <ContextMenuContent class="w-2">
                                        <ContextMenuItem
                                            @select="openEditTagDialog(tag)">
                                            <IconEdit class="h-4 w-4" />
                                            编辑
                                        </ContextMenuItem>
                                        <ContextMenuItem
                                            @select="deleteTag(tag)">
                                            <IconTrash class="h-4 w-4" />
                                            删除</ContextMenuItem
                                        >
                                    </ContextMenuContent>
                                </ContextMenu>
                            </ToggleGroupItem>
                        </ToggleGroup>
                        <Dialog v-model:open="showTagEditDialog" modal>
                            <DialogTrigger>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    @click="openCreateTagDialog">
                                    <IconPlus />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {{
                                            editingTagName
                                                ? "编辑标签"
                                                : "添加标签"
                                        }}
                                    </DialogTitle>
                                </DialogHeader>
                                <DialogDescription class="flex flex-col gap-2">
                                    <InputGroup>
                                        <InputGroupInput
                                            v-model="tagName"
                                            placeholder="标签名称" />
                                        <InputGroupAddon align="inline-end">
                                            <input
                                                type="color"
                                                v-model="tagColor" />
                                        </InputGroupAddon>
                                    </InputGroup>
                                    <Button
                                        size="sm"
                                        class="self-end"
                                        @click="submitTag">
                                        <IconPlus class="h-4 w-4" />
                                        {{ editingTagName ? "保存" : "添加" }}
                                    </Button>
                                </DialogDescription>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
            <ManagerList />

            <Card v-if="loadError">
                <CardContent
                    class="flex items-center justify-between gap-4 py-6">
                    <p class="text-sm text-destructive">{{ loadError }}</p>
                    <Button variant="outline" @click="loadManagerData"
                        >重试</Button
                    >
                </CardContent>
            </Card>
            <div
                v-else-if="manager.filteredMods.length === 0"
                class="rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
                <p>当前没有匹配的 Mod。</p>
                <p class="mt-2">
                    你可以调整筛选条件，或从上方导入文件夹/压缩包来创建本地 Mod
                    条目。
                </p>
            </div>
        </template>

        <Dialog v-model:open="showBatchEditDialog">
            <DialogContent class="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>批量编辑 Mod 信息</DialogTitle>
                    <DialogDescription>
                        仅会更新你填写的字段，留空的字段会保持原值不变。
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-2">
                    <div class="grid gap-2">
                        <Label for="batch-version">版本</Label>
                        <Input
                            id="batch-version"
                            v-model="batchEditForm.modVersion" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="batch-author">作者</Label>
                        <Input
                            id="batch-author"
                            v-model="batchEditForm.modAuthor" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="batch-website">主页</Label>
                        <Input
                            id="batch-website"
                            v-model="batchEditForm.modWebsite" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="batch-type">类型</Label>
                        <Select id="batch-type" v-model="batchEditForm.modType">
                            <SelectTrigger>
                                <SelectValue placeholder="不修改类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">不修改</SelectItem>
                                <SelectItem
                                    v-for="item in manager.availableTypes"
                                    :key="item.id"
                                    :value="item.id">
                                    {{ item.name }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="grid gap-2">
                        <Label for="batch-tags">标签</Label>
                        <Textarea
                            id="batch-tags"
                            v-model="batchEditForm.tagsText"
                            rows="3"
                            placeholder="使用英文逗号分隔多个标签，例如：画质, 角色, 平衡性" />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        @click="showBatchEditDialog = false">
                        取消
                    </Button>
                    <Button @click="applyBatchEdit">保存修改</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>
<style scoped>
.grid-enter-active,
.grid-leave-active {
    transition: opacity 0.2s ease;
}

.grid-enter-from,
.grid-leave-to {
    opacity: 0;
}
</style>
