<script setup lang="ts">
import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { t } from "vue-router/dist/index-BzEKChPW.js";

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
const editingModId = ref<number | null>(null);
const dragSourceId = ref<number | null>(null);
const dragTargetId = ref<number | null>(null);
const dragPosition = ref<"before" | "after">("before");
const editForm = reactive<IEditModForm>({
    modName: "",
    modVersion: "",
    modAuthor: "",
    modWebsite: "",
    modType: 99,
    modDesc: "",
    tagsText: "",
});

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
    const confirmed = window.confirm(
        item.isInstalled
            ? `确定删除 ${item.modName} 吗？\n\n当前条目标记为已安装，删除只会移除本地缓存目录和列表记录，不会自动清理游戏目录中的文件。`
            : `确定删除 ${item.modName} 吗？此操作会删除本地缓存目录和列表记录。`,
    );

    if (!confirmed) {
        return;
    }

    const modPath = await getModStoragePath(item.id);

    if (modPath) {
        const deleted = await FileHandler.deleteFolder(modPath);

        if (!deleted) {
            ElMessage.error("删除 Mod 目录失败，请检查文件占用或权限设置。");
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
            (mod.tags ?? []).some((tag) => tag.name === manager.selectedTag),
        )
    ) {
        manager.selectedTag = "全部";
    }

    ElMessage.success(`已删除 ${item.modName}`);
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

    const type = manager.managerGame?.modType.find(
        (type) => type.id === item.modType,
    );

    if (nextInstalled) {
        if (typeof type?.install == "function") {
            const res = await type.install(item);
            if (typeof res == "boolean" && res == false) {
                item.isInstalled = false;
            }
        }
    } else {
        if (typeof type?.uninstall == "function") {
            const res = await type.uninstall(item);
            if (typeof res == "boolean" && res == false) {
                item.isInstalled = true;
            }
        }
    }
}

function clearDragState() {
    dragSourceId.value = null;
    dragTargetId.value = null;
    dragPosition.value = "before";
}

function handleDragStart(event: DragEvent, modId: number) {
    dragSourceId.value = modId;

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(modId));
    }
}

function handleDragOver(event: DragEvent, modId: number) {
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

    if (dragPosition.value === "after") {
        insertIndex += 1;
    }

    if (sourceIndex < targetIndex) {
        insertIndex -= 1;
    }

    reorderedVisibleMods.splice(insertIndex, 0, movingMod);

    const visibleIdSet = new Set(visibleMods.map((item) => item.id));
    const orderedAllMods = [...manager.managerModList].sort(
        (left, right) => left.weight - right.weight,
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
}

function getRowClass(item: IModInfo) {
    if (dragTargetId.value !== item.id || dragSourceId.value === item.id) {
        return "";
    }

    return dragPosition.value === "after"
        ? "border-b-2 border-primary"
        : "border-t-2 border-primary";
}
</script>
<template>
    <Card>
        <CardContent class="max-h-[calc(100vh-430px)] overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
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
                    >
                        <TableCell>
                            <div class="flex items-center gap-2">
                                <span
                                    class="inline-flex cursor-grab text-muted-foreground active:cursor-grabbing"
                                    draggable="true"
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
                                {{ item.modName }}
                            </div>
                        </TableCell>
                        <TableCell>{{ item.modVersion }}</TableCell>
                        <TableCell>
                            <Select
                                :model-value="item.modType"
                                @update:model-value="
                                    updateModType(item, $event)
                                "
                                :disabled="item.isInstalled"
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
                                    v-model="item.isInstalled"
                                    @update:model-value="
                                        updateModInstalled(item, $event)
                                    "
                                />
                                <Label :for="`is-installed-${item.id}`">
                                    {{ item.isInstalled ? "已安装" : "未安装" }}
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
                                    <Button variant="ghost" size="icon">
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
                                        variant="destructive"
                                        @click="deleteMod(item)"
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
</template>
<style scoped></style>
