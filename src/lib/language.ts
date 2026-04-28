import { computed, readonly, ref } from "vue";
import i18n from "@/lang";
import {
    languageOptions,
    normalizeAppLocale,
    resolveSystemLocale,
} from "@/lang/locales";
import type { AppLocale } from "@/lang/locales";
import { PersistentStore } from "@/lib/persistent-store";

export class Language {
    private static readonly STORAGE_KEY = "gmm-language";
    private static readonly languageState = ref<AppLocale>(resolveSystemLocale());

    private static initialized = false;
    private static initializationPromise: Promise<void> | null = null;

    /**
     * 将当前语言同步到 vue-i18n 与文档根节点，便于辅助技术识别页面语言。
     */
    private static apply(locale: AppLocale) {
        i18n.global.locale.value = locale;

        if (typeof document !== "undefined") {
            document.documentElement.lang = locale.replace("_", "-");
        }
    }

    private static async persist(locale: AppLocale) {
        await PersistentStore.set(Language.STORAGE_KEY, locale);
    }

    public static async initialize() {
        if (Language.initialized) {
            return;
        }

        if (Language.initializationPromise) {
            return Language.initializationPromise;
        }

        Language.apply(Language.languageState.value);

        Language.initializationPromise = (async () => {
            try {
                const storedLanguage = await PersistentStore.get<AppLocale>(
                    Language.STORAGE_KEY,
                    Language.languageState.value,
                );

                Language.languageState.value = normalizeAppLocale(
                    storedLanguage,
                    Language.languageState.value,
                );
            } catch (error: unknown) {
                console.error("读取语言设置失败");
                console.error(error);
            } finally {
                Language.apply(Language.languageState.value);
                Language.initialized = true;
                Language.initializationPromise = null;
            }
        })();

        return Language.initializationPromise;
    }

    public static set(locale: AppLocale) {
        const nextLanguage = normalizeAppLocale(locale);

        Language.languageState.value = nextLanguage;
        Language.apply(nextLanguage);
        void Language.persist(nextLanguage).catch((error: unknown) => {
            console.error("保存语言设置失败");
            console.error(error);
        });
    }

    public static use() {
        void Language.initialize();

        return {
            language: readonly(Language.languageState),
            languageLabel: computed(() => {
                return (
                    languageOptions.find(
                        (item) => item.value === Language.languageState.value,
                    )?.label ?? languageOptions[0].label
                );
            }),
            languageOptions,
            setLanguage: Language.set,
        };
    }
}
