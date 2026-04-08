import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { readonly, ref } from "vue";
import { PersistentStore } from "@/lib/persistent-store";

export class AutoStart {
    private static readonly STORAGE_KEY = "autoStart";
    private static readonly enabledState = ref(false);
    private static readonly loadingState = ref(true);

    private static initialized = false;
    private static initializationPromise: Promise<void> | null = null;

    /**
     * 初始化开机自启状态，并与持久化配置同步。
     */
    public static async initialize() {
        if (AutoStart.initialized) {
            return;
        }

        if (AutoStart.initializationPromise) {
            return AutoStart.initializationPromise;
        }

        AutoStart.initializationPromise = (async () => {
            try {
                const enabled = await isEnabled();

                AutoStart.enabledState.value = enabled;
                await PersistentStore.set(AutoStart.STORAGE_KEY, enabled);
            } catch (error: unknown) {
                console.error("读取开机自启状态失败");
                console.error(error);

                AutoStart.enabledState.value =
                    await PersistentStore.get<boolean>(
                        AutoStart.STORAGE_KEY,
                        false,
                    );
            } finally {
                AutoStart.loadingState.value = false;
                AutoStart.initialized = true;
                AutoStart.initializationPromise = null;
            }
        })();

        return AutoStart.initializationPromise;
    }

    /**
     * 更新系统开机自启状态，并回写到 Store。
     */
    public static async setEnabled(enabled: boolean) {
        await AutoStart.initialize();

        const previousValue = AutoStart.enabledState.value;
        AutoStart.enabledState.value = enabled;

        try {
            if (enabled) {
                await enable();
            } else {
                await disable();
            }

            await PersistentStore.set(AutoStart.STORAGE_KEY, enabled);
        } catch (error: unknown) {
            AutoStart.enabledState.value = previousValue;
            await PersistentStore.set(AutoStart.STORAGE_KEY, previousValue);
            throw error;
        }
    }

    public static use() {
        void AutoStart.initialize();

        return {
            autoStart: readonly(AutoStart.enabledState),
            autoStartLoading: readonly(AutoStart.loadingState),
            setAutoStart: AutoStart.setEnabled,
        };
    }
}

export function initializeAutoStart() {
    return AutoStart.initialize();
}

export function useAutoStart() {
    return AutoStart.use();
}
