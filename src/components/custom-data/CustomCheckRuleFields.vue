<script setup lang="ts">
import {
    formatKeywordText,
    parseKeywordText,
} from "@/lib/custom-definition-utils";

const props = defineProps<{
    isType?: boolean;
}>();

const model = defineModel<ICheckModType>({ required: true });

const keywordText = computed({
    get: () => formatKeywordText(model.value.Keyword),
    set: (value: string) => {
        model.value.Keyword = parseKeywordText(value);
    },
});
</script>

<template>
    <div class="grid gap-3">
        <div v-if="!props.isType" class="grid gap-2">
            <Label>类型 ID</Label>
            <Input v-model.number="model.TypeId" type="number" min="0" />
        </div>

        <div class="grid gap-2">
            <Label>检查方法</Label>
            <Select v-model="model.UseFunction">
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="extname">通过扩展名判断</SelectItem>
                    <SelectItem value="basename">通过文件名判断</SelectItem>
                    <SelectItem value="inPath">通过路径片段判断</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div class="grid gap-2">
            <Label>关键词</Label>
            <Textarea
                v-model="keywordText"
                class="min-h-24"
                placeholder="多个关键词请用逗号或换行分隔"
            />
        </div>
    </div>
</template>

<style scoped></style>
