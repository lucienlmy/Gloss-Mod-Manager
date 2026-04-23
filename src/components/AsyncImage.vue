<script setup lang="ts">
import { convertFileSrc } from "@tauri-apps/api/core";
const props = withDefaults(
    defineProps<{
        alt?: string;
        fallbackSrc?: string;
        src: string;
    }>(),
    {
        alt: "",
        fallbackSrc: "",
    },
);

const imageSrc = ref("");
const fallbackApplied = ref(false);

function resolveImageSrc(source: string) {
    if (!source) {
        return "";
    }

    if (
        source.includes("http://") ||
        source.includes("https://") ||
        source.startsWith("data:") ||
        source.startsWith("/")
    ) {
        return source;
    }

    return convertFileSrc(source);
}

function syncImageSrc() {
    fallbackApplied.value = false;
    imageSrc.value = resolveImageSrc(props.src);
}

function handleImageError() {
    if (fallbackApplied.value || !props.fallbackSrc) {
        return;
    }

    fallbackApplied.value = true;
    imageSrc.value = resolveImageSrc(props.fallbackSrc);
}

watch(
    () => [props.src, props.fallbackSrc],
    () => {
        syncImageSrc();
    },
    { immediate: true },
);
</script>
<template>
    <img :src="imageSrc" :alt="props.alt" @error="handleImageError" />
</template>
<style scoped></style>
