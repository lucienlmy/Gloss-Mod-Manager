import { LazyStore } from "@tauri-apps/plugin-store";
import { isProxy, toRaw } from "vue";
import { ref } from "vue";
import type { Ref } from "vue";
import { watch } from "vue";

export class PersistentStore {
    public static readonly store = new LazyStore("settings.json");

    /**
     * 读取指定键的持久化值；未命中时返回默认值副本。
     */
    public static async get<T>(
        key: string,
        fallback?: T,
    ): Promise<T | undefined> {
        const value = await PersistentStore.store.get<T>(key);

        if (value === undefined && fallback) {
            return PersistentStore.cloneValue(fallback);
        }

        return value;
    }

    /**
     * 写入指定键的持久化值。
     */
    public static async set<T>(key: string, value: T): Promise<void> {
        await PersistentStore.store.set(key, PersistentStore.cloneValue(value));
    }

    /**
     * 创建一个和 Tauri Store 自动同步的响应式引用。
     */
    public static useValue<T>(key: string, fallback: T): Ref<T> {
        const state = ref(PersistentStore.cloneValue(fallback)) as Ref<T>;
        let initialized = false;
        let hydrating = false;
        let dirtyBeforeReady = false;

        void PersistentStore.get(key, fallback)
            .then((value) => {
                if (dirtyBeforeReady) {
                    return;
                }

                hydrating = true;
                state.value = value as T;
                hydrating = false;
            })
            .catch((error: unknown) => {
                PersistentStore.logError("读取", key, error);
            })
            .finally(() => {
                initialized = true;

                if (!dirtyBeforeReady) {
                    return;
                }

                void PersistentStore.set(key, state.value).catch(
                    (error: unknown) => {
                        PersistentStore.logError("写入", key, error);
                    },
                );
            });

        watch(
            state,
            (value) => {
                if (hydrating) {
                    return;
                }

                if (!initialized) {
                    dirtyBeforeReady = true;
                    return;
                }

                void PersistentStore.set(key, value).catch((error: unknown) => {
                    PersistentStore.logError("写入", key, error);
                });
            },
            { deep: true },
        );

        return state;
    }

    /**
     * 避免对象类型默认值在多个引用之间共享同一个实例。
     */
    private static cloneValue<T>(value: T): T {
        const normalizedValue = PersistentStore.unwrapProxy(value);
        if (typeof structuredClone === "function") {
            return structuredClone(normalizedValue);
        }
        return normalizedValue;
    }

    /**
     * 持久化前先移除 Vue 响应式代理，避免 structuredClone 直接克隆 Proxy 时报错。
     */
    private static unwrapProxy<T>(value: T): T {
        if (!isProxy(value)) {
            return value;
        }
        if (typeof value === "object") {
            return JSON.parse(JSON.stringify(value)) as T;
        }

        return toRaw(value) as T;
    }

    private static logError(action: string, key: string, error: unknown) {
        console.error(`PersistentStore ${action}失败: ${key}`);
        console.error(error);
    }

    public static async getAllKeys() {
        const allkeys = await PersistentStore.store.keys();
        const data = [];
        for (const key of allkeys) {
            const value = await PersistentStore.get(key, null);
            data.push({ key, value });
        }
        return data;
    }
}
