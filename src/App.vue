<script setup lang="ts">
import { TrayIcon } from "@tauri-apps/api/tray";
import { Menu } from "@tauri-apps/api/menu";

async function setupTray() {
    const menu = await Menu.new({
        items: [
            {
                id: "open",
                text: "打开",
                action: () => {},
            },
            {
                id: "quit",
                text: "退出",
                action: () => {},
            },
        ],
    });

    const tray = await TrayIcon.new({
        menu,
        menuOnLeftClick: true,
    });
}

setupTray();
</script>
<template>
    <Layout>
        <RouterView />
    </Layout>
</template>
<style scoped></style>
