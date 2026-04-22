<script setup lang="ts">
import CustomInstallFields from "@/components/custom-data/CustomInstallFields.vue";

const props = withDefaults(
    defineProps<{
        showId?: boolean;
    }>(),
    {
        showId: true,
    },
);

const model = defineModel<IType>({ required: true });

const installModel = computed<ITypeInstall>({
    get: () => model.value.install as ITypeInstall,
    set: (value) => {
        model.value.install = value;
    },
});

const uninstallModel = computed<ITypeInstall>({
    get: () => model.value.uninstall as ITypeInstall,
    set: (value) => {
        model.value.uninstall = value;
    },
});
</script>

<template>
    <div class="grid gap-4">
        <div v-if="props.showId" class="grid gap-2">
            <Label>类型 ID</Label>
            <Input v-model="model.id" type="number" />
        </div>

        <div class="grid gap-2">
            <Label>名称</Label>
            <Input v-model="model.name" placeholder="显示名称" />
        </div>

        <div class="grid gap-2">
            <Label>安装路径</Label>
            <Input
                v-model="model.installPath"
                placeholder="相对于游戏目录的路径"
            />
        </div>

        <div class="grid gap-2 rounded-lg border p-3">
            <div class="text-sm font-medium">安装配置</div>
            <CustomInstallFields v-model="installModel" />
        </div>

        <div class="grid gap-2 rounded-lg border p-3">
            <div class="text-sm font-medium">卸载配置</div>
            <CustomInstallFields v-model="uninstallModel" />
        </div>
    </div>
</template>

<style scoped></style>
