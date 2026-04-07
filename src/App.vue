<script setup lang="ts">
import { defaultWindowIcon } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { TrayIcon } from "@tauri-apps/api/tray";
import { Menu } from "@tauri-apps/api/menu";
import { getCurrentWindow } from "@tauri-apps/api/window";

const TRAY_ID = "main-tray";

let tray: TrayIcon | null = null;
let unlistenCloseRequested: (() => void) | null = null;
let isQuitting = false;

async function showMainWindow() {
    const appWindow = getCurrentWindow();

    if (await appWindow.isMinimized()) {
        await appWindow.unminimize();
    }

    await appWindow.show();
    await appWindow.setFocus();
}

async function quitApplication() {
    isQuitting = true;

    if (unlistenCloseRequested) {
        unlistenCloseRequested();
        unlistenCloseRequested = null;
    }

    if (tray) {
        await tray.close();
        tray = null;
    }

    await getCurrentWindow().destroy();
}

async function setupTray() {
    if (!isTauri() || tray) {
        return;
    }

    const appWindow = getCurrentWindow();
    const icon = await defaultWindowIcon();

    const menu = await Menu.new({
        items: [
            {
                id: "open",
                text: "打开",
                action: () => {
                    void showMainWindow();
                },
            },
            {
                id: "quit",
                text: "退出",
                action: () => {
                    void quitApplication();
                },
            },
        ],
    });

    await TrayIcon.removeById(TRAY_ID);

    tray = await TrayIcon.new({
        id: TRAY_ID,
        icon: icon ?? undefined,
        menu,
        showMenuOnLeftClick: false,
        tooltip: "Gloss Mod Manager",
        action: (event) => {
            if (
                event.type === "Click" &&
                event.button === "Left" &&
                event.buttonState === "Up"
            ) {
                void showMainWindow();
            }
        },
    });

    if (!unlistenCloseRequested) {
        unlistenCloseRequested = await appWindow.onCloseRequested((event) => {
            if (isQuitting) {
                return;
            }

            event.preventDefault();
            void appWindow.hide();
        });
    }
}

setupTray();
</script>
<template>
    <Layout>
        <RouterView />
    </Layout>
</template>
<style scoped></style>
