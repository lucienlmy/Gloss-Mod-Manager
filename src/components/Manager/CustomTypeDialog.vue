<script setup lang="ts">
import { ElMessage } from "element-plus-message";
import CustomCheckRuleFields from "@/components/custom-data/CustomCheckRuleFields.vue";
import CustomInstallFields from "@/components/custom-data/CustomInstallFields.vue";
import {
    cloneDefinition,
    createEmptyCustomType,
} from "@/lib/custom-definition-utils";
import { saveLegacyCustomTypeDefinition } from "@/lib/legacy-custom-data";

const manager = useManager();
const settings = useSettings();

const dialogOpen = ref(false);
const form = reactive(createEmptyCustomType());

function resetForm() {
    Object.assign(form, cloneDefinition(createEmptyCustomType()));
}

async function saveType() {
    if (!manager.managerGame?.gameName) {
        ElMessage.warning("请先选择游戏。");
        return;
    }

    if (!form.name.trim() || !form.installPath.trim()) {
        ElMessage.warning("请填写完整的类型名称和安装路径。");
        return;
    }

    if (form.checkModType.Keyword.length === 0) {
        ElMessage.warning("请至少填写一个类型识别关键词。");
        return;
    }

    try {
        await saveLegacyCustomTypeDefinition(
            manager.managerGame.gameName,
            cloneDefinition({
                ...form,
                name: form.name.trim(),
                installPath: form.installPath.trim(),
            }),
        );
        await manager.reloadSupportedGames();
        await manager.refreshRuntimeData({
            storagePath: settings.storagePath,
            closeSoftLinks: settings.closeSoftLinks,
        });

        dialogOpen.value = false;
        resetForm();
        ElMessage.success("已保存自定义类型。");
    } catch (error: unknown) {
        console.error("保存自定义类型失败");
        console.error(error);
        ElMessage.error(
            error instanceof Error ? error.message : "保存自定义类型失败。",
        );
    }
}

watch(dialogOpen, (opened) => {
    if (!opened) {
        resetForm();
    }
});
</script>

<template>
    <Dialog v-model:open="dialogOpen">
        <DialogTrigger as-child>
            <Button
                variant="outline"
                size="sm"
                :disabled="!manager.managerGame"
            >
                <IconPlus class="h-4 w-4" />
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>创建自定义类型</DialogTitle>
                <DialogDescription>
                    会写入旧版兼容的 Types 配置，并立即合并到当前游戏类型列表。
                </DialogDescription>
            </DialogHeader>

            <div class="grid gap-4 py-2">
                <div class="grid gap-2">
                    <Label>当前游戏</Label>
                    <Input
                        :model-value="
                            manager.managerGame?.gameShowName ||
                            manager.managerGame?.gameName ||
                            ''
                        "
                        readonly
                    />
                </div>

                <div class="grid gap-2">
                    <Label>类型名称</Label>
                    <Input
                        v-model="form.name"
                        placeholder="例如：插件、脚本、贴图"
                    />
                </div>

                <div class="grid gap-2">
                    <Label>安装路径</Label>
                    <Input
                        v-model="form.installPath"
                        placeholder="相对于游戏目录，例如：mods/plugins"
                    />
                </div>

                <div class="grid gap-2 rounded-lg border p-3">
                    <div class="text-sm font-medium">安装配置</div>
                    <CustomInstallFields v-model="form.install" />
                </div>

                <div class="grid gap-2 rounded-lg border p-3">
                    <div class="text-sm font-medium">卸载配置</div>
                    <CustomInstallFields v-model="form.uninstall" />
                </div>

                <div class="grid gap-2 rounded-lg border p-3">
                    <div class="text-sm font-medium">类型识别规则</div>
                    <CustomCheckRuleFields
                        v-model="form.checkModType"
                        is-type
                    />
                </div>
            </div>

            <DialogFooter>
                <Button
                    variant="outline"
                    @click="
                        dialogOpen = false;
                        resetForm();
                    "
                >
                    取消
                </Button>
                <Button @click="saveType">保存</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped></style>
