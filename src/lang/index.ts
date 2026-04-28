import { createI18n } from "vue-i18n";
import { fallbackLocale, resolveSystemLocale } from "@/lang/locales";
import type { AppLocale } from "@/lang/locales";

type LocaleMessageValue =
    | string
    | ILocaleMessages;

interface ILocaleMessages {
    [key: string]: LocaleMessageValue;
}

interface ILangModule {
    default?: ILocaleMessages;
}

const modules = import.meta.glob<ILangModule>("./*.ts", { eager: true });

export function getLangAll() {
    const message = getLangFiles(modules);

    return message as Record<AppLocale, ILocaleMessages>;
}

/**
 * 获取所有语言文件
 * @param mList 语言模块列表
 */
function getLangFiles(mList: Record<string, ILangModule>) {
    const msg: Record<string, ILocaleMessages> = {};
    for (const path in mList) {
        if (mList[path].default) {
            //  获取文件名
            const pathName = path.replace(/(\.\/|\.ts)/g, "");

            if (pathName === "index" || pathName === "locales") {
                continue;
            }

            if (msg[pathName]) {
                msg[pathName] = {
                    ...msg[pathName],
                    ...mList[path].default,
                };
            } else {
                msg[pathName] = mList[path].default;
            }
        }
    }
    return msg;
}

const i18n = createI18n<false>({
    legacy: false, // 使用Composition API，这里必须设置为false
    globalInjection: true,
    locale: resolveSystemLocale(),
    fallbackLocale,
    missingWarn: false,
    fallbackWarn: false,
    messages: getLangAll(),
});

export default i18n;
