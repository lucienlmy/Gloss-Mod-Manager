<script setup lang="ts">
import { ElMessage } from "element-plus-message";

const manager = useManager();

const tagName = ref("");
const tagColor = ref("#14F7D8");
const showTagEditDialog = ref(false);
const editingTagName = ref("");

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
        ((manager.tags = manager.tags.map((tag) => {
            if (tag.name !== editingTagName.value) {
                return tag;
            }

            return {
                name,
                color: tagColor.value,
            };
        })),
            (manager.managerModList = manager.managerModList.map((mod) => ({
                ...mod,
                tags: (mod.tags ?? []).map((tag) => {
                    if (tag.name !== editingTagName.value) {
                        return tag;
                    }

                    return {
                        name,
                        color: tagColor.value,
                    };
                }),
            }))));

        if (manager.selectedTag === editingTagName.value) {
            manager.selectedTag = name;
        }

        await manager.saveManagerData();
        ElMessage.success("标签已更新。");
    } else {
        manager.tags = [
            ...manager.tags,
            {
                name,
                color: tagColor.value,
            },
        ];
        await manager.saveManagerData();
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

    await manager.saveManagerData();
    ElMessage.success("标签已删除。");
}

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
                :value="tag.name">
                <ContextMenu>
                    <ContextMenuTrigger class="flex items-center gap-2">
                        <div
                            class="h-2.5 w-2.5 rounded-full"
                            :style="{
                                backgroundColor: tag.color,
                            }"></div>
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
                    @click="openCreateTagDialog">
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
                            placeholder="标签名称" />
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
