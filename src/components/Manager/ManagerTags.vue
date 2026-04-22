<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus-message";
import {
    clearManagerInternalDrag,
    INTERNAL_DRAG_THRESHOLD,
    managerDragKind,
    managerDraggingTagName,
    startManagerTagDrag,
} from "@/lib/manager-internal-drag";

const manager = useManager();

const tagName = ref("");
const tagColor = ref("#14F7D8");
const showTagEditDialog = ref(false);
const editingTagName = ref("");
const dragTargetTagName = ref("");
const pendingTagName = ref("");
const pendingPointerPosition = ref<{ x: number; y: number } | null>(null);

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
    try {
        await manager.upsertTag({
            name: tagName.value,
            color: tagColor.value,
            previousName: editingTagName.value || undefined,
        });
        ElMessage.success(editingTagName.value ? "标签已更新。" : "标签已添加。");
        resetTagEditor();
        showTagEditDialog.value = false;
    } catch (error: unknown) {
        ElMessage.warning(
            error instanceof Error ? error.message : "保存标签失败。",
        );
    }
}

async function deleteTag(tag: ITag) {
    const confirmed = window.confirm(
        `确定删除标签 ${tag.name} 吗？这会同时把它从所有 Mod 上移除。`,
    );

    if (!confirmed) {
        return;
    }

    try {
        await manager.deleteTag(tag.name);

        if (editingTagName.value === tag.name) {
            resetTagEditor();
            showTagEditDialog.value = false;
        }

        ElMessage.success("标签已删除。");
    } catch (error: unknown) {
        ElMessage.error(
            error instanceof Error ? error.message : "删除标签失败。",
        );
    }
}

function clearTagDragState() {
    dragTargetTagName.value = "";
    pendingTagName.value = "";
    pendingPointerPosition.value = null;
}

async function reorderTag(draggedName: string, targetName: string) {
    const reordered = await manager.reorderTags(draggedName, targetName);

    if (!reordered) {
        clearTagDragState();
        return;
    }

    clearTagDragState();
    ElMessage.success("标签顺序已更新。");
}

function handleTagPointerDown(event: PointerEvent, tag: ITag) {
    if (event.button !== 0) {
        return;
    }

    pendingTagName.value = tag.name;
    pendingPointerPosition.value = {
        x: event.clientX,
        y: event.clientY,
    };
}

function handleTagPointerEnter(tag: ITag) {
    if (
        managerDragKind.value !== "tag" ||
        !managerDraggingTagName.value ||
        managerDraggingTagName.value === tag.name
    ) {
        return;
    }

    dragTargetTagName.value = tag.name;
}

function handleTagPointerLeave(tag: ITag) {
    if (dragTargetTagName.value === tag.name) {
        dragTargetTagName.value = "";
    }
}

function handleWindowPointerMove(event: PointerEvent) {
    if (
        !pendingTagName.value ||
        !pendingPointerPosition.value ||
        managerDragKind.value !== null
    ) {
        return;
    }

    const deltaX = event.clientX - pendingPointerPosition.value.x;
    const deltaY = event.clientY - pendingPointerPosition.value.y;

    if (Math.hypot(deltaX, deltaY) < INTERNAL_DRAG_THRESHOLD) {
        return;
    }

    startManagerTagDrag(pendingTagName.value);
}

function handleWindowPointerUp() {
    const draggedName = managerDraggingTagName.value;
    const targetName = dragTargetTagName.value;

    if (
        managerDragKind.value === "tag" &&
        draggedName &&
        targetName &&
        draggedName !== targetName
    ) {
        void reorderTag(draggedName, targetName);
        clearManagerInternalDrag();
        return;
    }

    clearTagDragState();
}

onMounted(() => {
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp, true);
});

onUnmounted(() => {
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("pointerup", handleWindowPointerUp, true);
});

function resetTagEditor() {
    editingTagName.value = "";
    tagName.value = "";
    tagColor.value = "#14F7D8";
}
</script>
<template>
    <div class="flex flex-wrap items-center gap-2 text-sm">
        <ToggleGroup type="single" v-model="manager.selectedTag">
            <ToggleGroupItem value="全部"> 全部标签 </ToggleGroupItem>
            <ToggleGroupItem
                v-for="tag in manager.tags"
                :key="tag.name"
                :value="tag.name"
            >
                <ContextMenu>
                    <ContextMenuTrigger
                        class="flex items-center gap-2 rounded-md px-1 py-0.5 cursor-grab active:cursor-grabbing"
                        :class="
                            dragTargetTagName === tag.name &&
                            managerDraggingTagName !== tag.name
                                ? 'ring-1 ring-primary/50 bg-primary/5'
                                : ''
                        "
                        @pointerdown="handleTagPointerDown($event, tag)"
                        @pointerenter="handleTagPointerEnter(tag)"
                        @pointerleave="handleTagPointerLeave(tag)"
                    >
                        <div
                            class="h-2.5 w-2.5 rounded-full"
                            :style="{
                                backgroundColor: tag.color,
                            }"
                        ></div>
                        {{ tag.name }}
                    </ContextMenuTrigger>
                    <ContextMenuContent class="w-2">
                        <ContextMenuItem @select="openEditTagDialog(tag)">
                            <IconEdit class="h-4 w-4" />
                            编辑
                        </ContextMenuItem>
                        <ContextMenuItem @select="deleteTag(tag)">
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
                    @click="openCreateTagDialog"
                >
                    <IconPlus />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {{ editingTagName ? "编辑标签" : "添加标签" }}
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription class="flex flex-col gap-2">
                    <InputGroup>
                        <InputGroupInput
                            v-model="tagName"
                            placeholder="标签名称"
                        />
                        <InputGroupAddon align="inline-end">
                            <input type="color" v-model="tagColor" />
                        </InputGroupAddon>
                    </InputGroup>
                    <Button size="sm" class="self-end" @click="submitTag">
                        <IconPlus class="h-4 w-4" />
                        {{ editingTagName ? "保存" : "添加" }}
                    </Button>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    </div>
</template>
<style scoped></style>
