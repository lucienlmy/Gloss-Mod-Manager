<script setup lang="ts">
import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { queueGlossModDownload } from "@/lib/gloss-download-queue";

interface IEditModForm {
    modName: string;
    modVersion: string;
    modAuthor: string;
    modWebsite: string;
    modType: number | string;
    modDesc: string;
    tagsText: string;
}

const manager = useManager();
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const editingModId = ref<number | null>(null);
const deletingModId = ref<number | null>(null);
const deleteTargetMod = ref<IModInfo | null>(null);
const dragSourceId = ref<number | null>(null);
const dragTargetId = ref<number | null>(null);
const dragPosition = ref<"before" | "after">("before");
const tagDropTargetId = ref<number | null>(null);
const operatingIds = ref<number[]>([]);
const updateingIds = ref<number[]>([]);
const editForm = reactive<IEditModForm>({
    modName: "",
    modVersion: "",
    modAuthor: "",
    modWebsite: "",
    modType: 99,
    modDesc: "",
    tagsText: "",
});

const TAG_DRAG_MIME = "application/x-gloss-manager-tag";

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

            const existingTag = manager.tags.find((tag) => tag.name === name);

            tagMap.set(name, {
                name,
                color: existingTag?.color ?? createTagColor(name),
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

function getModStoragePath(modId: number) {
    if (!manager.managerRoot) {
        return "";
    }

    return join(manager.managerRoot, String(modId));
}

async function open(item: IModInfo) {
    const path = await getModStoragePath(item.id);

    if (!path) {
        ElMessage.warning("当前没有可用的 Mod 储存目录。");
        return;
    }

    await FileHandler.openFolder(path);
}

function openEditDialog(item: IModInfo) {
    editingModId.value = item.id;
    editForm.modName = item.modName;
    editForm.modVersion = item.modVersion;
    editForm.modAuthor = item.modAuthor ?? "";
    editForm.modWebsite = item.modWebsite ?? "";
    editForm.modType = item.modType ?? 99;
    editForm.modDesc = item.modDesc ?? "";
    editForm.tagsText = (item.tags ?? []).map((tag) => tag.name).join(", ");
    showEditDialog.value = true;
}

function resetEditDialog() {
    editingModId.value = null;
    editForm.modName = "";
    editForm.modVersion = "";
    editForm.modAuthor = "";
    editForm.modWebsite = "";
    editForm.modType = 99;
    editForm.modDesc = "";
    editForm.tagsText = "";
}

async function saveEdit() {
    const modId = editingModId.value;
    const modName = editForm.modName.trim();
    const modVersion = editForm.modVersion.trim();

    if (!modId) {
        return;
    }

    if (!modName) {
        ElMessage.warning("Mod 名称不能为空。");
        return;
    }

    if (!modVersion) {
        ElMessage.warning("版本号不能为空。");
        return;
    }

    const tags = dedupeTags(
        editForm.tagsText
            .split(/[,，]/u)
            .map((item) => item.trim())
            .filter(Boolean),
    );

    manager.managerModList = manager.managerModList.map((item) => {
        if (item.id !== modId) {
            return item;
        }

        return {
            ...item,
            modName,
            modVersion,
            modAuthor: editForm.modAuthor.trim(),
            modWebsite: editForm.modWebsite.trim(),
            modType: editForm.modType,
            modDesc: editForm.modDesc.trim(),
            tags,
        };
    });
    manager.tags = dedupeTags([...manager.tags, ...tags]);
    await manager.saveManagerData();
    showEditDialog.value = false;
    resetEditDialog();
    ElMessage.success("Mod 信息已更新。");
}

async function deleteMod(item: IModInfo) {
    deleteTargetMod.value = item;
    showDeleteDialog.value = true;
}

function closeDeleteDialog(force = false) {
    if (!force && deletingModId.value !== null) {
        return;
    }

    showDeleteDialog.value = false;

    if (force) {
        deleteTargetMod.value = null;
    }
}

function getDeleteDescription(item: IModInfo) {
    return item.isInstalled
        ? `确定删除 ${item.modName} 吗？\n\n当前条目标记为已安装，删除只会移除本地缓存目录和列表记录，不会自动清理游戏目录中的文件。`
        : `确定删除 ${item.modName} 吗？此操作会删除本地缓存目录和列表记录。`;
}

async function confirmDeleteMod() {
    const item = deleteTargetMod.value;

    if (!item) {
        closeDeleteDialog(true);
        return;
    }

    deletingModId.value = item.id;

    const modPath = await getModStoragePath(item.id);

    try {
        if (modPath) {
            const deleted = await FileHandler.deleteFolder(modPath);

            if (!deleted) {
                ElMessage.error(
                    "删除 Mod 目录失败，请检查文件占用或权限设置。",
                );
                return;
            }
        }

        manager.managerModList = manager.managerModList.filter(
            (mod) => mod.id !== item.id,
        );
        await manager.saveManagerData();

        if (
            manager.selectedTag !== "全部" &&
            !manager.managerModList.some((mod) =>
                (mod.tags ?? []).some(
                    (tag) => tag.name === manager.selectedTag,
                ),
            )
        ) {
            manager.selectedTag = "全部";
        }

        ElMessage.success(`已删除 ${item.modName}`);
        closeDeleteDialog(true);
    } finally {
        deletingModId.value = null;
    }
}

async function updateModType(item: IModInfo, nextType: unknown) {
    if (nextType === null || nextType === undefined) {
        return;
    }

    if (
        typeof nextType !== "string" &&
        typeof nextType !== "number" &&
        typeof nextType !== "bigint"
    ) {
        return;
    }

    item.modType =
        typeof nextType === "bigint" ? nextType.toString() : nextType;
    await manager.saveManagerData();
    ElMessage.success(`已更新 ${item.modName} 的类型。`);
}

async function updateModInstalled(item: IModInfo, nextInstalled: unknown) {
    if (typeof nextInstalled !== "boolean") {
        return;
    }

    const previousInstalled = item.isInstalled;
    item.isInstalled = nextInstalled;
    startOperating(item.id);

    try {
        const type = manager.managerGame?.modType.find(
            (type) => type.id === item.modType,
        );
        if (nextInstalled) {
            if (typeof type?.install == "function") {
                try {
                    const res = await type.install(item);
                    if (typeof res == "boolean" && res == false) {
                        item.isInstalled = false;
                    }
                } catch (error) {
                    console.error(error);
                    ElMessage.error(`安装 ${item.modName} 失败：${error}`);
                    item.isInstalled = false;
                }
            }
        } else {
            if (typeof type?.uninstall == "function") {
                try {
                    const res = await type.uninstall(item);
                    if (typeof res == "boolean" && res == false) {
                        item.isInstalled = true;
                    }
                } catch (error) {
                    ElMessage.error(`卸载 ${item.modName} 失败：${error}`);
                    item.isInstalled = true;
                }
            }
        }

        if (item.isInstalled !== previousInstalled) {
            await manager.saveManagerData();
        }
    } finally {
        finishOperating(item.id);
    }
}

function clearDragState() {
    dragSourceId.value = null;
    dragTargetId.value = null;
    dragPosition.value = "before";
}

function clearTagDropState() {
    tagDropTargetId.value = null;
}

function startOperating(modId: number) {
    if (!operatingIds.value.includes(modId)) {
        operatingIds.value = [...operatingIds.value, modId];
    }
}

function finishOperating(modId: number) {
    operatingIds.value = operatingIds.value.filter((item) => item !== modId);
}

function isOperating(modId: number) {
    return operatingIds.value.includes(modId);
}

function startUpdate(modId: number) {
    if (!updateingIds.value.includes(modId)) {
        updateingIds.value = [...updateingIds.value, modId];
    }
}

function finishUpdate(modId: number) {
    updateingIds.value = updateingIds.value.filter((item) => item !== modId);
}

function isUpdateing(modId: number) {
    return updateingIds.value.includes(modId);
}

function handleSelectionChange(event: Event, modId: number) {
    manager.toggleSelection(
        modId,
        (event.target as HTMLInputElement | null)?.checked ?? false,
    );
}

function getDraggedTagName(event: DragEvent) {
    return event.dataTransfer?.getData(TAG_DRAG_MIME)?.trim() || "";
}

function isTagDragEvent(event: DragEvent) {
    return Array.from(event.dataTransfer?.types ?? []).includes(TAG_DRAG_MIME);
}

async function toggleTagOnMod(item: IModInfo, tagName: string) {
    const matchedTag = manager.tags.find((tag) => tag.name === tagName);

    if (!matchedTag) {
        clearTagDropState();
        return;
    }

    const hasTag = (item.tags ?? []).some((tag) => tag.name === tagName);
    item.tags = hasTag
        ? (item.tags ?? []).filter((tag) => tag.name !== tagName)
        : dedupeTags([...(item.tags ?? []), matchedTag]);
    await manager.saveManagerData();
    clearTagDropState();
    ElMessage.success(
        hasTag
            ? `已从 ${item.modName} 移除标签：${tagName}`
            : `已为 ${item.modName} 添加标签：${tagName}`,
    );
}

async function queueModUpdate(item: IModInfo) {
    if (item.from !== "GlossMod" || !item.webId) {
        ElMessage.warning("当前只有来自 Gloss 的 Mod 支持直接更新。");
        return;
    }

    startUpdate(item.id);

    try {
        const result = await queueGlossModDownload({
            modId: item.webId,
            resourceId: "latest",
            managerModList: manager.managerModList,
            replaceLocalModId: item.id,
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
        console.error("提交更新下载失败");
        console.error(error);
        ElMessage.error(
            error instanceof Error ? error.message : "提交更新下载失败。",
        );
    } finally {
        finishUpdate(item.id);
    }
}

function handleDragStart(event: DragEvent, modId: number) {
    if (manager.selectionMode) {
        return;
    }

    dragSourceId.value = modId;

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(modId));
    }
}

function handleDragOver(event: DragEvent, modId: number) {
    if (isTagDragEvent(event)) {
        event.preventDefault();
        tagDropTargetId.value = modId;

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "copy";
        }

        return;
    }

    clearTagDropState();

    if (dragSourceId.value === null || dragSourceId.value === modId) {
        return;
    }

    event.preventDefault();
    dragTargetId.value = modId;

    const currentTarget = event.currentTarget as HTMLElement | null;

    if (!currentTarget) {
        dragPosition.value = "before";
        return;
    }

    const { top, height } = currentTarget.getBoundingClientRect();
    dragPosition.value = event.clientY > top + height / 2 ? "after" : "before";

    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
    }
}

async function handleDrop(event: DragEvent, modId: number) {
    const draggedTagName = getDraggedTagName(event);

    if (draggedTagName) {
        event.preventDefault();
        const targetMod = manager.managerModList.find(
            (item) => item.id === modId,
        );

        if (targetMod) {
            await toggleTagOnMod(targetMod, draggedTagName);
        }

        clearDragState();
        return;
    }

    event.preventDefault();

    if (dragSourceId.value === null || dragSourceId.value === modId) {
        clearDragState();
        return;
    }

    const visibleMods = [...manager.filteredMods];
    const sourceIndex = visibleMods.findIndex(
        (item) => item.id === dragSourceId.value,
    );
    const targetIndex = visibleMods.findIndex((item) => item.id === modId);

    if (sourceIndex === -1 || targetIndex === -1) {
        clearDragState();
        return;
    }

    const reorderedVisibleMods = [...visibleMods];
    const [movingMod] = reorderedVisibleMods.splice(sourceIndex, 1);
    let insertIndex = targetIndex;

    if (sourceIndex < targetIndex) {
        insertIndex -= 1;
    }

    if (dragPosition.value === "after") {
        insertIndex += 1;
    }

    reorderedVisibleMods.splice(insertIndex, 0, movingMod);

    const visibleIdSet = new Set(visibleMods.map((item) => item.id));
    const orderedAllMods = [...manager.managerModList].sort(
        (left, right) => (left.weight ?? 0) - (right.weight ?? 0),
    );
    let visibleIndex = 0;

    // 仅重排当前可见子集，隐藏项保持原有相对位置不变。
    manager.managerModList = orderedAllMods.map((item, index) => {
        const nextItem = visibleIdSet.has(item.id)
            ? reorderedVisibleMods[visibleIndex++]
            : item;

        return {
            ...nextItem,
            weight: index + 1,
        };
    });

    await manager.saveManagerData();
    clearDragState();
    ElMessage.success("Mod 顺序已更新。");
}

function handleDragEnd() {
    clearDragState();
    clearTagDropState();
}

function getRowClass(item: IModInfo) {
    const classNames = [] as string[];

    if (manager.selectionIds.includes(item.id)) {
        classNames.push("bg-primary/5");
    }

    if (tagDropTargetId.value === item.id) {
        classNames.push("ring-1 ring-primary/40 bg-primary/5");
    }

    if (dragTargetId.value !== item.id || dragSourceId.value === item.id) {
        return classNames.join(" ");
    }

    classNames.push(
        dragPosition.value === "after"
            ? "border-b-2 border-primary"
            : "border-t-2 border-primary",
    );

    return classNames.join(" ");
}
</script>
<template>
    <Card>
        <CardContent class="max-h-[calc(100vh-430px)] overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead v-if="manager.selectionMode" class="w-12">
                            选择
                        </TableHead>
                        <TableHead>名称</TableHead>
                        <TableHead class="w-30">版本</TableHead>
                        <TableHead class="w-30">类型</TableHead>
                        <TableHead class="w-30">状态</TableHead>
                        <TableHead class="w-30">预览</TableHead>
                        <TableHead class="w-30">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow
                        v-for="item in manager.filteredMods"
                        :key="item.id"
                        :class="getRowClass(item)"
                        @dragover="handleDragOver($event, item.id)"
                        @drop="handleDrop($event, item.id)"
                        @dragleave="clearTagDropState"
                    >
                        <TableCell v-if="manager.selectionMode">
                            <input
                                type="checkbox"
                                class="h-4 w-4 accent-primary"
                                :checked="manager.selectionIds.includes(item.id)"
                                @change="handleSelectionChange($event, item.id)"
                            />
                        </TableCell>
                        <TableCell>
                            <div class="flex items-center gap-2">
                                <span
                                    v-if="!manager.selectionMode"
                                    class="inline-flex cursor-grab text-muted-foreground active:cursor-grabbing"
                                    :draggable="!manager.selectionMode"
                                    @dragstart="
                                        handleDragStart($event, item.id)
                                    "
                                    @dragend="handleDragEnd"
                                >
                                    <IconGripVertical class="w-4 h-4" />
                                </span>
                                <Badge
                                    variant="outline"
                                    v-for="tag in item.tags"
                                    :key="tag.name"
                                >
                                    <div
                                        class="h-2.5 w-2.5 rounded-full"
                                        :style="{
                                            backgroundColor: tag.color,
                                        }"
                                    ></div>
                                    {{ tag.name }}
                                </Badge>
                                <span class="font-medium">{{ item.modName }}</span>
                                <Badge
                                    v-if="item.isUpdate"
                                    variant="outline"
                                    class="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                >
                                    可更新
                                </Badge>
                            </div>
                        </TableCell>
                        <TableCell>{{ item.modVersion }}</TableCell>
                        <TableCell>
                            <Select
                                :model-value="item.modType"
                                @update:model-value="
                                    updateModType(item, $event)
                                "
                                :disabled="item.isInstalled || isOperating(item.id)"
                            >
                                <SelectTrigger>
                                    <SelectValue></SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        v-for="type in manager.managerGame
                                            ?.modType"
                                        :key="type.id"
                                        :value="type.id"
                                        >{{ type.name }}</SelectItem
                                    >
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <div class="flex items-center gap-2">
                                <Switch
                                    :id="`is-installed-${item.id}`"
                                    :model-value="item.isInstalled"
                                    @update:model-value="
                                        updateModInstalled(item, $event)
                                    "
                                    :disabled="isOperating(item.id)"
                                />
                                <Label :for="`is-installed-${item.id}`">
                                    {{
                                        isOperating(item.id)
                                            ? "处理中"
                                            : item.isInstalled
                                              ? "已安装"
                                              : "未安装"
                                    }}
                                </Label>
                            </div>
                        </TableCell>
                        <TableCell>
                            <HoverCard v-if="item.cover">
                                <HoverCardTrigger as-child>
                                    <Button variant="ghost" size="icon">
                                        <IconEye class="w-4 h-4" />
                                    </Button>
                                </HoverCardTrigger>
                                <HoverCardContent>
                                    <AsyncImage :src="item.cover" />
                                </HoverCardContent>
                            </HoverCard>
                            <IconEyeOff
                                v-else
                                class="w-4 h-4 text-muted-foreground"
                            />
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger as-child>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        :disabled="
                                            deletingModId === item.id ||
                                            isUpdateing(item.id)
                                        "
                                    >
                                        <IconMenu class="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        @click="openEditDialog(item)"
                                    >
                                        编辑
                                        <DropdownMenuShortcut>
                                            <IconSquarePen />
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="open(item)">
                                        打开
                                        <DropdownMenuShortcut>
                                            <IconFolderOpen />
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        v-if="
                                            item.from === 'GlossMod' &&
                                            item.webId
                                        "
                                        @click="queueModUpdate(item)"
                                    >
                                        {{
                                            isUpdateing(item.id)
                                                ? "更新中..."
                                                : "更新"
                                        }}
                                        <DropdownMenuShortcut>
                                            <IconRefreshCw
                                                :class="
                                                    isUpdateing(item.id)
                                                        ? 'animate-spin'
                                                        : ''
                                                "
                                            />
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        v-if="item.modWebsite"
                                        as-child
                                    >
                                        <a
                                            :href="item.modWebsite"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            >网址
                                            <DropdownMenuShortcut>
                                                <IconGlobe />
                                            </DropdownMenuShortcut>
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        @click="deleteMod(item)"
                                        :disabled="deletingModId === item.id"
                                    >
                                        删除
                                        <DropdownMenuShortcut>
                                            <IconTrash
                                                class="text-destructive"
                                            />
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </CardContent>
    </Card>
    <Dialog v-model:open="showEditDialog" modal>
        <DialogContent class="sm:max-w-xl" @escape-key-down="resetEditDialog">
            <DialogHeader>
                <DialogTitle>编辑 Mod</DialogTitle>
                <DialogDescription>
                    修改当前 Mod 的基础信息，保存后会立即写回本地配置。
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-2">
                <div class="grid gap-2">
                    <Label for="mod-name">名称</Label>
                    <Input id="mod-name" v-model="editForm.modName" />
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="grid gap-2">
                        <Label for="mod-version">版本</Label>
                        <Input id="mod-version" v-model="editForm.modVersion" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="mod-type">类型</Label>
                        <Select v-model="editForm.modType">
                            <SelectTrigger id="mod-type">
                                <SelectValue></SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="type in manager.managerGame?.modType"
                                    :key="type.id"
                                    :value="type.id"
                                >
                                    {{ type.name }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="grid gap-2">
                        <Label for="mod-author">作者</Label>
                        <Input id="mod-author" v-model="editForm.modAuthor" />
                    </div>
                    <div class="grid gap-2">
                        <Label for="mod-website">网站</Label>
                        <Input id="mod-website" v-model="editForm.modWebsite" />
                    </div>
                </div>
                <div class="grid gap-2">
                    <Label for="mod-tags">标签</Label>
                    <Input
                        id="mod-tags"
                        v-model="editForm.tagsText"
                        placeholder="多个标签请用逗号分隔"
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="mod-desc">描述</Label>
                    <Textarea id="mod-desc" v-model="editForm.modDesc" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" @click="showEditDialog = false">
                    取消
                </Button>
                <Button @click="saveEdit">保存</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <AlertDialog
        :open="showDeleteDialog"
        @update:open="(open: boolean) => !open && closeDeleteDialog()"
    >
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle> 确认删除 </AlertDialogTitle>
                <AlertDialogDescription class="whitespace-pre-line">
                    {{
                        deleteTargetMod
                            ? getDeleteDescription(deleteTargetMod)
                            : "未找到要删除的 Mod。"
                    }}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel :disabled="deletingModId !== null">
                    取消
                </AlertDialogCancel>
                <AlertDialogAction
                    :disabled="deletingModId !== null"
                    class="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60"
                    @click="confirmDeleteMod()"
                >
                    {{ deletingModId !== null ? "删除中..." : "确认删除" }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
<style scoped></style>
