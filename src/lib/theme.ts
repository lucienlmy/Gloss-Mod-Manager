import { computed, readonly, ref } from "vue";
import { PersistentStore } from "@/lib/persistent-store";

export type ThemeMode = "light" | "dark" | "system";

export class Theme {
    private static readonly STORAGE_KEY = "gmm-theme";
    private static readonly themeState = ref<ThemeMode>("system");

    private static initialized = false;
    private static initializationPromise: Promise<void> | null = null;
    private static mediaQueryBound = false;

    /**
     * 获取系统主题偏好的媒体查询对象。
     */
    private static getMediaQuery() {
        if (typeof window === "undefined" || !("matchMedia" in window)) {
            return null;
        }

        return window.matchMedia("(prefers-color-scheme: dark)");
    }

    /**
     * 将外部输入规范化为受支持的主题值。
     */
    private static normalize(mode: unknown): ThemeMode {
        if (mode === "light" || mode === "dark" || mode === "system") {
            return mode;
        }

        return "system";
    }

    /**
     * 将 system 主题解析为当前实际生效的亮暗模式。
     */
    private static resolve(mode: ThemeMode): "light" | "dark" {
        if (mode === "system") {
            return Theme.getMediaQuery()?.matches ? "dark" : "light";
        }

        return mode;
    }

    /**
     * 将主题状态应用到文档根节点。
     */
    private static apply(mode: ThemeMode) {
        if (typeof document === "undefined") {
            return;
        }

        const resolved = Theme.resolve(mode);
        const root = document.documentElement;

        root.classList.toggle("dark", resolved === "dark");
        root.style.colorScheme = resolved;
    }

    /**
     * 将用户选择的主题写入本地存储。
     */
    private static async persist(mode: ThemeMode) {
        await PersistentStore.set(Theme.STORAGE_KEY, mode);
    }

    /**
     * 绑定系统主题变化监听，避免重复注册。
     */
    private static bindMediaQueryListener() {
        const mediaQuery = Theme.getMediaQuery();
        if (mediaQuery && !Theme.mediaQueryBound) {
            mediaQuery.addEventListener(
                "change",
                Theme.handleSystemThemeChange,
            );
            Theme.mediaQueryBound = true;
        }
    }

    /**
     * 系统主题变化时，在跟随系统模式下同步界面状态。
     */
    private static handleSystemThemeChange() {
        if (Theme.themeState.value === "system") {
            Theme.apply(Theme.themeState.value);
        }
    }

    /**
     * 初始化主题状态，并绑定系统主题变化监听。
     */
    public static async initialize() {
        if (Theme.initialized) {
            return;
        }

        if (Theme.initializationPromise) {
            return Theme.initializationPromise;
        }

        Theme.apply(Theme.themeState.value);
        Theme.bindMediaQueryListener();

        Theme.initializationPromise = (async () => {
            try {
                const storedTheme = await PersistentStore.get<ThemeMode>(
                    Theme.STORAGE_KEY,
                    Theme.themeState.value,
                );

                Theme.themeState.value = Theme.normalize(storedTheme);
            } catch (error: unknown) {
                console.error("读取主题设置失败");
                console.error(error);
            } finally {
                Theme.apply(Theme.themeState.value);
                Theme.bindMediaQueryListener();
                Theme.initialized = true;
                Theme.initializationPromise = null;
            }
        })();

        return Theme.initializationPromise;
    }

    /**
     * 更新当前主题并立即持久化与应用。
     */
    public static set(mode: ThemeMode) {
        const nextTheme = Theme.normalize(mode);

        Theme.themeState.value = nextTheme;
        Theme.apply(nextTheme);
        void Theme.persist(nextTheme).catch((error: unknown) => {
            console.error("保存主题设置失败");
            console.error(error);
        });
    }

    /**
     * 暴露给组件使用的主题响应式状态。
     */
    public static use() {
        void Theme.initialize();

        return {
            theme: readonly(Theme.themeState),
            resolvedTheme: computed(() =>
                Theme.resolve(Theme.themeState.value),
            ),
            setTheme: Theme.set,
        };
    }
}
