import { documentDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { AutoStart } from "@/lib/auto-start";
import { PersistentStore } from "@/lib/persistent-store";
import { Theme } from "@/lib/theme";
import { ref } from "vue";

export const settingsStartPageOptions = [
    { name: "首页", value: "/" },
    { name: "游戏页", value: "/games" },
    { name: "管理页", value: "/manager" },
    { name: "游览页", value: "/explore" },
    { name: "下载页", value: "/download" },
    { name: "MCP页", value: "/mcp" },
    { name: "备份页", value: "/backup" },
    { name: "关于页", value: "/about" },
    { name: "设置页", value: "/settings" },
] as const;

export const useSettings = defineStore("Settings", () => {
    const { theme, setTheme } = Theme.use();
    const { autoStart, autoStartLoading, setAutoStart } = AutoStart.use();

    const defaultStartPage = PersistentStore.useValue<string>(
        "defaultStartPage",
        "/",
    );
    const storagePath = PersistentStore.useValue<string>("storagePath", "");
    const autoAddAfterDownload = PersistentStore.useValue<boolean>(
        "autoAddAfterDownload",
        true,
    );
    const selectGameByFolder = PersistentStore.useValue<boolean>(
        "selectGameByFolder",
        false,
    );
    const debugMode = PersistentStore.useValue<boolean>("debugMode", false);
    const modifiableDuringGame = PersistentStore.useValue<boolean>(
        "modifiableDuringGame",
        false,
    );
    const showPreloadList = PersistentStore.useValue<boolean>(
        "showPreloadList",
        true,
    );
    const disableSymlinkInstall = PersistentStore.useValue<boolean>(
        "disableSymlinkInstall",
        false,
    );
    const debugInfo = ref<unknown>({});

    watch(
        debugMode,
        async (newValue) => {
            if (!newValue) {
                debugInfo.value = {};
                return;
            }

            debugInfo.value = await PersistentStore.getAllKeys();
        },
        { immediate: true },
    );

    async function selectStoragePath() {
        const selected = await open({
            directory: true,
            defaultPath:
                storagePath.value || `${await documentDir()}/Gloss Mod Manager`,
            title: "选择储存路径",
        });

        if (selected) {
            storagePath.value = selected;
        }
    }

    return {
        theme,
        setTheme,
        autoStart,
        autoStartLoading,
        setAutoStart,
        defaultStartPage,
        storagePath,
        autoAddAfterDownload,
        selectGameByFolder,
        debugMode,
        modifiableDuringGame,
        showPreloadList,
        disableSymlinkInstall,
        debugInfo,
        settingsStartPageOptions,
        selectStoragePath,
    };
});
