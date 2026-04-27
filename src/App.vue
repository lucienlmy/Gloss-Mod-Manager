<script setup lang="ts">
import "@/lib/global";
</script>
<template>
    <Layout>
        <RouterView />
        <DownloadFilePickerDialog />
        <AppUpdateInstallDialog />
    </Layout>
</template>
<style scoped></style>
