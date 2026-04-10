<script setup lang="ts">
const props = defineProps<{
    src: string;
}>();

const imageSrc = ref("");

async function getImageSrc() {
    const base64 = await FileHandler.readFileAsBase64(props.src);
    imageSrc.value = base64;
}
getImageSrc();
</script>
<template>
    <img :src="imageSrc" />
</template>
<style scoped></style>
