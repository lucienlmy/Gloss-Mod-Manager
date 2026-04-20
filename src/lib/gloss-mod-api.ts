import { fetch as httpFetch } from "@tauri-apps/plugin-http";

interface IGlossApiResponse<T> {
    success: boolean;
    msg: string;
    data: T | null;
}

export const GLOSS_MOD_API_BASE_URL = "https://mod.3dmgame.com/api/v3";
export const GLOSS_MOD_WEB_BASE_URL = "https://mod.3dmgame.com";
export const GLOSS_MOD_KEY = (import.meta.env.GLOSS_MOD_KEY ?? "").trim();

export function resolveGlossAssetUrl(path?: string) {
    if (!path) {
        return "";
    }

    if (/^https?:\/\//u.test(path)) {
        return path;
    }

    const normalized = path.startsWith("/") ? path : `/${path}`;

    return `${GLOSS_MOD_WEB_BASE_URL}${normalized}`;
}

export async function fetchGlossModDetail(modId: number | string) {
    const normalizedModId = String(modId ?? "").trim();

    if (!normalizedModId) {
        throw new Error("缺少有效的 Mod ID。");
    }

    if (!GLOSS_MOD_KEY) {
        throw new Error("未读取到 GLOSS_MOD_KEY，请检查 .env 配置。");
    }

    const response = await httpFetch(
        `${GLOSS_MOD_API_BASE_URL}/mods/${normalizedModId}`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: GLOSS_MOD_KEY,
            },
        },
    );
    const payload = (await response.json()) as IGlossApiResponse<IMod>;

    if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.msg || "读取 Mod 详情失败");
    }

    return payload.data;
}

export async function fetchGlossGamePlugins() {
    if (!GLOSS_MOD_KEY) {
        throw new Error("未读取到 GLOSS_MOD_KEY，请检查 .env 配置。");
    }

    const response = await httpFetch(`${GLOSS_MOD_API_BASE_URL}/gmm/plugins`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: GLOSS_MOD_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
    });
    const payload = (await response.json()) as IGlossApiResponse<
        IGamePlugins[]
    >;

    if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.msg || "读取前置列表失败");
    }

    return payload.data;
}
