<script setup lang="ts">
import { convertFileSrc } from "@tauri-apps/api/core";
const props = defineProps<{
    src: string;
}>();

const imageSrc = ref("");

async function getImageSrc() {
    const base64 = convertFileSrc(props.src);
    imageSrc.value = base64;
}
getImageSrc();
</script>
<template>
    <img :src="imageSrc" />
</template>
<style scoped></style>
