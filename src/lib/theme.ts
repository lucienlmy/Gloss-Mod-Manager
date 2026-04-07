import { computed, readonly, ref } from "vue";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "gmm-theme";
const theme = ref<ThemeMode>("system");

let initialized = false;
let mediaQueryBound = false;

function getMediaQuery() {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
        return null;
    }

    return window.matchMedia("(prefers-color-scheme: dark)");
}

function normalizeTheme(value: unknown): ThemeMode {
    if (value === "light" || value === "dark" || value === "system") {
        return value;
    }

    return "system";
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
    if (mode === "system") {
        return getMediaQuery()?.matches ? "dark" : "light";
    }

    return mode;
}

function applyTheme(mode: ThemeMode) {
    if (typeof document === "undefined") {
        return;
    }

    const resolved = resolveTheme(mode);
    const root = document.documentElement;

    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
}

function persistTheme(mode: ThemeMode) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, mode);
}

function handleSystemThemeChange() {
    if (theme.value === "system") {
        applyTheme(theme.value);
    }
}

export function initializeTheme() {
    if (initialized) {
        return;
    }

    initialized = true;

    if (typeof window !== "undefined") {
        theme.value = normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
    }

    applyTheme(theme.value);

    const mediaQuery = getMediaQuery();
    if (mediaQuery && !mediaQueryBound) {
        mediaQuery.addEventListener("change", handleSystemThemeChange);
        mediaQueryBound = true;
    }
}

export function setTheme(mode: ThemeMode) {
    const nextTheme = normalizeTheme(mode);

    theme.value = nextTheme;
    persistTheme(nextTheme);
    applyTheme(nextTheme);
}

export function useTheme() {
    initializeTheme();

    return {
        theme: readonly(theme),
        resolvedTheme: computed(() => resolveTheme(theme.value)),
        setTheme,
    };
}
