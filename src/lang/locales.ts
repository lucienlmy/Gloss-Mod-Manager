export const fallbackLocale = "en_US";

export const languageOptions = [
    {
        value: "en_US",
        label: "English",
        nativeName: "English",
        region: "United States",
    },
    {
        value: "zh_CN",
        label: "简体中文",
        nativeName: "简体中文",
        region: "中国大陆",
    },
    {
        value: "zh_TW",
        label: "繁體中文",
        nativeName: "繁體中文",
        region: "台灣 / 香港",
    },
    {
        value: "ja_JP",
        label: "日本語",
        nativeName: "日本語",
        region: "日本",
    },
    {
        value: "ko_KR",
        label: "한국어",
        nativeName: "한국어",
        region: "대한민국",
    },
    {
        value: "es_ES",
        label: "Español",
        nativeName: "Español",
        region: "España / Latinoamérica",
    },
    {
        value: "fr_FR",
        label: "Français",
        nativeName: "Français",
        region: "France",
    },
    {
        value: "de_DE",
        label: "Deutsch",
        nativeName: "Deutsch",
        region: "Deutschland",
    },
    {
        value: "pt_BR",
        label: "Português",
        nativeName: "Português",
        region: "Brasil",
    },
    {
        value: "ru_RU",
        label: "Русский",
        nativeName: "Русский",
        region: "Россия",
    },
] as const;

export type AppLocale = (typeof languageOptions)[number]["value"];

const supportedLocaleSet = new Set<string>(
    languageOptions.map((item) => item.value),
);

const exactLocaleMap: Record<string, AppLocale> = {
    "en-us": "en_US",
    "en-gb": "en_US",
    "en-au": "en_US",
    "en-ca": "en_US",
    "zh-cn": "zh_CN",
    "zh-sg": "zh_CN",
    "zh-hans": "zh_CN",
    "zh-hans-cn": "zh_CN",
    "zh-tw": "zh_TW",
    "zh-hk": "zh_TW",
    "zh-mo": "zh_TW",
    "zh-hant": "zh_TW",
    "zh-hant-tw": "zh_TW",
    "ja-jp": "ja_JP",
    "ko-kr": "ko_KR",
    "es-es": "es_ES",
    "es-mx": "es_ES",
    "es-ar": "es_ES",
    "es-cl": "es_ES",
    "fr-fr": "fr_FR",
    "fr-ca": "fr_FR",
    "de-de": "de_DE",
    "de-at": "de_DE",
    "de-ch": "de_DE",
    "pt-br": "pt_BR",
    "pt-pt": "pt_BR",
    "ru-ru": "ru_RU",
};

const primaryLocaleMap: Record<string, AppLocale> = {
    en: "en_US",
    zh: "zh_CN",
    ja: "ja_JP",
    ko: "ko_KR",
    es: "es_ES",
    fr: "fr_FR",
    de: "de_DE",
    pt: "pt_BR",
    ru: "ru_RU",
};

export function isAppLocale(value: unknown): value is AppLocale {
    return typeof value === "string" && supportedLocaleSet.has(value);
}

export function normalizeAppLocale(
    value: unknown,
    fallback: AppLocale = fallbackLocale,
): AppLocale {
    return isAppLocale(value) ? value : fallback;
}

function normalizeLanguageTag(value: string) {
    return value.trim().replace(/_/gu, "-").toLowerCase();
}

function resolveLocaleTag(value: string): AppLocale | null {
    const normalizedValue = normalizeLanguageTag(value);

    if (!normalizedValue) {
        return null;
    }

    const exactLocale = exactLocaleMap[normalizedValue];
    if (exactLocale) {
        return exactLocale;
    }

    const primaryLanguage = normalizedValue.split("-")[0];
    return primaryLocaleMap[primaryLanguage] ?? null;
}

export function resolveSystemLocale(languageList?: readonly string[]) {
    const languages =
        languageList ??
        (typeof navigator === "undefined"
            ? []
            : navigator.languages?.length
              ? navigator.languages
              : [navigator.language]);

    for (const language of languages) {
        const resolvedLocale = resolveLocaleTag(language);

        if (resolvedLocale) {
            return resolvedLocale;
        }
    }

    return fallbackLocale;
}
