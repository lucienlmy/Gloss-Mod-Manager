import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { ElMessage } from "element-plus-message";
import { fetchGlossModDetail } from "@/lib/gloss-mod-api";
import { queueCustomDownload } from "@/lib/custom-download-queue";
import { queueGlossModDownloadWithSelection } from "@/lib/download-file-selection";
import { readGmmPackageDetails } from "@/lib/gmm-package";
import { importGmmShareCode, parseGmmShareCode } from "@/lib/gmm-share-code";
import { normalizeCompareText } from "@/lib/gloss-download";
import {
    NexusModsAuthorizationError,
    fetchThirdPartyModDetail,
} from "@/lib/third-party-mod-api";
import router from "@/routes";
import { useLaunchStore } from "@/stores/launch";

const APP_LAUNCH_FILES_EVENT_NAME = "app-launch-files";

type TParsedLaunchIntent =
    | {
          type: "gmm-file";
          filePath: string;
      }
    | {
          type: "gmm-installmod";
          modId: number;
          resourceId?: string;
      }
    | {
          type: "gmm-customize";
          downloadUrl: string;
          fileName: string;
      }
    | {
          type: "gmm-package";
          code: string;
      }
    | {
          type: "nxm";
          domainName: string;
          modId: string;
          fileId: string;
          key?: string;
          expires?: string;
      };

interface ILaunchFilesEventPayload {
    paths?: string[];
}

let initialized = false;
let processingQueue = Promise.resolve();

function stripWrappingQuotes(value: string) {
    return value.trim().replace(/^['"]+|['"]+$/gu, "");
}

function createUrlSearchParams(value: string) {
    const trimmedValue = value.trim();
    const normalizedValue = trimmedValue.startsWith("?")
        ? trimmedValue.slice(1)
        : trimmedValue;

    return new URLSearchParams(normalizedValue);
}

function resolveGmmInstallmodIntent(
    rawValue: string,
): TParsedLaunchIntent | null {
    const normalizedValue = rawValue.replace(/^gmm:\/\/installmod\/?/iu, "");
    let pathModId = "";
    let queryPart = normalizedValue;

    if (!normalizedValue.startsWith("?")) {
        const [pathPart, ...restParts] = normalizedValue.split("?");

        if (/^\d+$/u.test(pathPart.trim())) {
            pathModId = pathPart.trim();
        }

        queryPart = restParts.length > 0 ? restParts.join("?") : "";
    }

    const searchParams = createUrlSearchParams(queryPart);
    const modId = Number(searchParams.get("id") || pathModId);

    if (!Number.isFinite(modId) || modId <= 0) {
        return null;
    }

    return {
        type: "gmm-installmod",
        modId,
        resourceId:
            searchParams.get("fid") ||
            searchParams.get("resourceId") ||
            undefined,
    };
}

function resolveGmmCustomizeIntent(
    rawValue: string,
): TParsedLaunchIntent | null {
    const normalizedValue = rawValue.replace(/^gmm:\/\/customize\/?/iu, "");
    const searchParams = createUrlSearchParams(normalizedValue);
    const downloadUrl = searchParams.get("url")?.trim() ?? "";
    const fileName = searchParams.get("name")?.trim() ?? "";

    if (!/^https?:\/\//iu.test(downloadUrl) || !fileName) {
        return null;
    }

    return {
        type: "gmm-customize",
        downloadUrl,
        fileName,
    };
}

function resolveGmmPackageIntent(rawValue: string): TParsedLaunchIntent | null {
    let encodedCode = rawValue.replace(/^gmm:\/\/package\/?/iu, "").trim();

    if (!encodedCode) {
        return null;
    }

    try {
        encodedCode = decodeURIComponent(encodedCode);
    } catch {
        // 兼容未编码的旧分享码。
    }

    return {
        type: "gmm-package",
        code: encodedCode,
    };
}

function resolveNxmIntent(rawValue: string): TParsedLaunchIntent | null {
    try {
        const parsedUrl = new URL(rawValue);
        const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

        if (
            parsedUrl.protocol !== "nxm:" ||
            pathParts[0] !== "mods" ||
            pathParts[2] !== "files"
        ) {
            return null;
        }

        return {
            type: "nxm",
            domainName: parsedUrl.hostname,
            modId: pathParts[1],
            fileId: pathParts[3],
            key: parsedUrl.searchParams.get("key") || undefined,
            expires: parsedUrl.searchParams.get("expires") || undefined,
        };
    } catch {
        return null;
    }
}

function resolveGmmFileIntent(rawValue: string): TParsedLaunchIntent | null {
    const normalizedPath = stripWrappingQuotes(rawValue);

    if (!normalizedPath.toLowerCase().endsWith(".gmm")) {
        return null;
    }

    return {
        type: "gmm-file",
        filePath: normalizedPath,
    };
}

function parseLaunchIntent(rawValue: string): TParsedLaunchIntent | null {
    const normalizedValue = stripWrappingQuotes(rawValue);

    if (!normalizedValue) {
        return null;
    }

    if (/^gmm:\/\/installmod/iu.test(normalizedValue)) {
        return resolveGmmInstallmodIntent(normalizedValue);
    }

    if (/^gmm:\/\/customize/iu.test(normalizedValue)) {
        return resolveGmmCustomizeIntent(normalizedValue);
    }

    if (/^gmm:\/\/package/iu.test(normalizedValue)) {
        return resolveGmmPackageIntent(normalizedValue);
    }

    if (/^nxm:\/\//iu.test(normalizedValue)) {
        return resolveNxmIntent(normalizedValue);
    }

    return resolveGmmFileIntent(normalizedValue);
}

async function navigateTo(path: string) {
    await router.isReady();

    if (router.currentRoute.value.path === path) {
        return;
    }

    await router.push(path);
}

async function ensureManagerGame(options: {
    glossGameId?: number;
    nexusDomain?: string;
    gameName?: string;
}) {
    const manager = useManager();
    const settings = useSettings();

    await manager.reloadSupportedGames();

    const matchedGame = manager.supportedGames.find((game) => {
        if (
            options.glossGameId !== undefined &&
            Number(game.GlossGameId) === Number(options.glossGameId)
        ) {
            return true;
        }

        if (
            options.nexusDomain &&
            game.nexusMods?.game_domain_name === options.nexusDomain
        ) {
            return true;
        }

        if (
            options.gameName &&
            normalizeCompareText(game.gameName) ===
                normalizeCompareText(options.gameName)
        ) {
            return true;
        }

        return false;
    });

    if (!matchedGame) {
        return null;
    }

    const managedGame = manager.managerGameList.find((game) => {
        return (
            Number(game.GlossGameId) === Number(matchedGame.GlossGameId) ||
            normalizeCompareText(game.gameName) ===
                normalizeCompareText(matchedGame.gameName)
        );
    });

    manager.managerGame = {
        ...matchedGame,
        ...(managedGame ?? {}),
    };

    if (settings.storagePath) {
        await manager.refreshRuntimeData({
            storagePath: settings.storagePath,
            closeSoftLinks: settings.closeSoftLinks,
        });
    }

    return manager.managerGame;
}

async function handleGmmFileIntent(
    intent: Extract<TParsedLaunchIntent, { type: "gmm-file" }>,
) {
    const manager = useManager();
    const settings = useSettings();
    const launchStore = useLaunchStore();
    const packageDetails = await readGmmPackageDetails(intent.filePath);

    if (packageDetails.info.gameID) {
        await ensureManagerGame({
            glossGameId: Number(packageDetails.info.gameID),
        });
    }

    if (!settings.storagePath || !manager.managerGame || !manager.managerRoot) {
        await navigateTo("/manager");
        ElMessage.warning("请先选择游戏并配置储存路径，再导入 GMM 包。");
        return;
    }

    await navigateTo("/manager");
    launchStore.enqueueManagerAction({
        type: "open-gmm-import",
        filePath: intent.filePath,
    });
}

async function handleGmmInstallmodIntent(
    intent: Extract<TParsedLaunchIntent, { type: "gmm-installmod" }>,
) {
    const manager = useManager();
    const mod = await fetchGlossModDetail(intent.modId);

    if (mod.game_id) {
        await ensureManagerGame({ glossGameId: Number(mod.game_id) });
    } else if (mod.game_name) {
        await ensureManagerGame({ gameName: mod.game_name });
    }

    await navigateTo("/download");
    const result = await queueGlossModDownloadWithSelection({
        mod,
        modId: mod.id,
        resourceId: intent.resourceId,
        managerModList: manager.managerModList,
    });

    if (result) {
        ElMessage.success(result.message);
    }
}

async function handleGmmCustomizeIntent(
    intent: Extract<TParsedLaunchIntent, { type: "gmm-customize" }>,
) {
    await navigateTo("/download");
    const result = await queueCustomDownload({
        downloadUrl: intent.downloadUrl,
        fileName: intent.fileName,
        title: intent.fileName,
    });

    ElMessage.success(result.message);
}

function buildShareImportMessage(result: {
    addedCount: number;
    updatedCount: number;
    skippedCount: number;
    totalCount: number;
}) {
    const summaryParts = [] as string[];

    if (result.addedCount > 0) {
        summaryParts.push(`新增 ${result.addedCount} 个`);
    }

    if (result.updatedCount > 0) {
        summaryParts.push(`更新 ${result.updatedCount} 个`);
    }

    if (result.skippedCount > 0) {
        summaryParts.push(`跳过 ${result.skippedCount} 个`);
    }

    return summaryParts.length > 0
        ? `分享码已导入：${summaryParts.join("，")}。`
        : `分享码已解析，共 ${result.totalCount} 个 Mod。`;
}

async function handleGmmPackageIntent(
    intent: Extract<TParsedLaunchIntent, { type: "gmm-package" }>,
) {
    const manager = useManager();
    const settings = useSettings();
    const shareMods = parseGmmShareCode(intent.code);
    const preferredGameId = shareMods.find((item) => item.gameID)?.gameID;

    if (preferredGameId) {
        await ensureManagerGame({ glossGameId: Number(preferredGameId) });
    }

    if (!settings.storagePath || !manager.managerGame || !manager.managerRoot) {
        await navigateTo("/manager");
        ElMessage.warning("请先选择游戏并配置储存路径，再导入分享码内容。");
        return;
    }

    const result = await importGmmShareCode({
        code: intent.code,
    });

    await navigateTo("/manager");
    ElMessage.success(buildShareImportMessage(result));
}

async function handleNxmIntent(
    intent: Extract<TParsedLaunchIntent, { type: "nxm" }>,
) {
    const manager = useManager();
    const settings = useSettings();

    const targetGame = await ensureManagerGame({
        nexusDomain: intent.domainName,
    });

    if (!targetGame) {
        await navigateTo("/games");
        ElMessage.warning("当前未找到与该 NXM 链接对应的游戏配置。");
        return;
    }

    await navigateTo("/download");

    try {
        const mod = await fetchThirdPartyModDetail(
            "NexusMods",
            targetGame,
            intent.modId,
            {
                gameDomain: intent.domainName,
            },
            settings.nexusModsUser,
        );
        const result = await queueThirdPartyModDownloadWithSelection({
            provider: "NexusMods",
            mod,
            fileId: intent.fileId,
            gameName: targetGame.gameName,
            managerModList: manager.managerModList,
            nexusUser: settings.nexusModsUser,
            nexusDownloadAuthorization: {
                key: intent.key,
                expires: intent.expires,
            },
        });

        if (result) {
            ElMessage.success(result.message);
        }
    } catch (error: unknown) {
        if (error instanceof NexusModsAuthorizationError) {
            await navigateTo("/settings");
            ElMessage.warning("请先在设置页完成 NexusMods 授权。");
            return;
        }

        throw error;
    }
}

async function handleLaunchIntent(intent: TParsedLaunchIntent) {
    switch (intent.type) {
        case "gmm-file":
            await handleGmmFileIntent(intent);
            return;
        case "gmm-installmod":
            await handleGmmInstallmodIntent(intent);
            return;
        case "gmm-customize":
            await handleGmmCustomizeIntent(intent);
            return;
        case "gmm-package":
            await handleGmmPackageIntent(intent);
            return;
        case "nxm":
            await handleNxmIntent(intent);
            return;
    }
}

function enqueueLaunchTargets(rawTargets: string[]) {
    processingQueue = processingQueue
        .then(async () => {
            for (const rawTarget of rawTargets) {
                const intent = parseLaunchIntent(rawTarget);

                if (!intent) {
                    continue;
                }

                try {
                    await handleLaunchIntent(intent);
                } catch (error: unknown) {
                    console.error("处理启动协议失败");
                    console.error(error);
                    ElMessage.error(
                        error instanceof Error
                            ? error.message
                            : "处理启动协议失败，请查看控制台日志。",
                    );
                }
            }
        })
        .catch((error: unknown) => {
            console.error("处理启动协议队列失败");
            console.error(error);
        });
}

async function takeInitialLaunchFiles() {
    try {
        return (await invoke<string[]>("app_take_pending_launch_files")) ?? [];
    } catch (error: unknown) {
        console.error("读取初始启动文件失败");
        console.error(error);
        return [];
    }
}

export async function initializeExternalLaunchHandling() {
    if (initialized) {
        return;
    }

    initialized = true;

    const initialFiles = await takeInitialLaunchFiles();
    if (initialFiles.length > 0) {
        enqueueLaunchTargets([initialFiles[0]]);
    }

    try {
        const initialUrls = await getCurrent();
        if (Array.isArray(initialUrls) && initialUrls.length > 0) {
            enqueueLaunchTargets(initialUrls);
        }
    } catch (error: unknown) {
        console.error("读取初始深链失败");
        console.error(error);
    }

    await listen<ILaunchFilesEventPayload>(
        APP_LAUNCH_FILES_EVENT_NAME,
        (event) => {
            const filePath = event.payload?.paths?.[0];

            if (!filePath) {
                return;
            }

            enqueueLaunchTargets([filePath]);
        },
    );

    await onOpenUrl((urls) => {
        if (urls.length === 0) {
            return;
        }

        enqueueLaunchTargets(urls);
    });
}
