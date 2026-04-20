<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";

defineOptions({
    name: "BackupTreeNode",
});

const props = withDefaults(
    defineProps<{
        node: IBackupTreeNode;
        selectedKeys: string[];
        depth?: number;
        disabled?: boolean;
    }>(),
    {
        depth: 0,
        disabled: false,
    },
);

const emit = defineEmits<{
    toggle: [payload: { node: IBackupTreeNode; checked: boolean }];
}>();

const checkboxRef = ref<HTMLInputElement | null>(null);
const open = ref(props.depth < 1);

function collectLeafKeys(node: IBackupTreeNode): string[] {
    if (!node.isDirectory || !node.children?.length) {
        return [node.relativePath];
    }

    return node.children.flatMap((child) => collectLeafKeys(child));
}

const selectedKeySet = computed(() => new Set(props.selectedKeys));
const descendantLeafKeys = computed(() => collectLeafKeys(props.node));
const checked = computed(
    () =>
        descendantLeafKeys.value.length > 0 &&
        descendantLeafKeys.value.every((key) => selectedKeySet.value.has(key)),
);
const indeterminate = computed(
    () =>
        !checked.value &&
        descendantLeafKeys.value.some((key) => selectedKeySet.value.has(key)),
);
const fileCount = computed(() => descendantLeafKeys.value.length);

watchEffect(() => {
    if (checkboxRef.value) {
        checkboxRef.value.indeterminate = indeterminate.value;
    }
});

function handleToggle(event: Event) {
    emit("toggle", {
        node: props.node,
        checked: (event.target as HTMLInputElement).checked,
    });
}

function handleDetailsToggle(event: Event) {
    open.value = (event.currentTarget as HTMLDetailsElement).open;
}
</script>

<template>
    <details
        v-if="node.isDirectory"
        :open="open"
        @toggle="handleDetailsToggle"
        class="rounded-lg border border-border/60 bg-background/70"
    >
        <summary
            class="flex cursor-pointer list-none items-center gap-3 px-3 py-2 text-sm"
        >
            <span class="w-4 text-center text-xs text-muted-foreground">
                {{ open ? "▾" : "▸" }}
            </span>
            <input
                ref="checkboxRef"
                type="checkbox"
                :checked="checked"
                :disabled="disabled"
                class="h-4 w-4 rounded border-border"
                @click.stop
                @change="handleToggle"
            />
            <span
                class="min-w-0 flex-1 truncate font-medium"
                :title="node.relativePath"
            >
                {{ node.label }}
            </span>
            <span class="text-xs text-muted-foreground"
                >{{ fileCount }} 项</span
            >
        </summary>

        <div class="ml-5 border-l border-border/60 px-3 py-2">
            <div class="flex flex-col gap-2">
                <BackupTreeNode
                    v-for="child in node.children ?? []"
                    :key="child.relativePath"
                    :node="child"
                    :depth="depth + 1"
                    :disabled="disabled"
                    :selected-keys="selectedKeys"
                    @toggle="emit('toggle', $event)"
                />
            </div>
        </div>
    </details>

    <label
        v-else
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/40"
    >
        <span class="w-4 text-center text-xs text-muted-foreground">•</span>
        <input
            ref="checkboxRef"
            type="checkbox"
            :checked="checked"
            :disabled="disabled"
            class="h-4 w-4 rounded border-border"
            @change="handleToggle"
        />
        <span class="min-w-0 flex-1 truncate" :title="node.relativePath">
            {{ node.label }}
        </span>
    </label>
</template>

<style scoped>
summary::-webkit-details-marker {
    display: none;
}
</style>
