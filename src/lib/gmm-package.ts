import { basename, join, tempDir } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { importLocalModSources } from "@/lib/local-mod-import";
import { SevenZip } from "@/lib/sevenZip";

interface IGmmPackageManager {
    managerRoot: string;
    managerGame: ISupportedGames | null;
    managerModList: IModInfo[];
    availableTypes: IType[];
    textCollator: Intl.Collator;
    tags: ITag[];
    saveManagerData: () => Promise<void>;
}

export interface IGmmPackageDetails {
    filePath: string;
    info: IInfo;
    packs: IModInfo[];
}

export interface IInstallGmmPackageOptions {
    manager: IGmmPackageManager;
    filePath: string;
    selectedFolderKeys?: string[];
}

function normalizeSlashes(filePath: string) {
    return filePath.replace(/[\\/]+/gu, "/");
}

function isHttpUrl(value?: string) {
    return /^https?:\/\//iu.test((value ?? "").trim());
}

function toLocalCoverPath(cover?: string) {
    const normalizedCover = (cover ?? "")
        .trim()
        .replace(/^file:\/*/iu, "")
        .replace(/^[/\\]+/u, "");

    return normalizedCover ? normalizeSlashes(normalizedCover) : "";
}

function isAbsoluteLocalPath(filePath: string) {
    return (
        /^[A-Za-z]:[\\/]/u.test(filePath) ||
        filePath.startsWith("/") ||
        filePath.startsWith("\\")
    );
}

function sanitizePackFolderKey(value: string) {
    return value.replace(/[<>:"/\\|?*\u0000-\u001F]/gu, "-").trim();
}

export function resolveGmmPackFolderKey(mod: Partial<IModInfo>) {
    const explicitKey =
        typeof mod.other?.gmmPackFolderKey === "string"
            ? mod.other.gmmPackFolderKey
            : "";
    const preferredKey =
        explicitKey ||
        (typeof mod.md5 === "string" ? mod.md5.trim() : "") ||
        `mod-${mod.id ?? Date.now()}`;

    return sanitizePackFolderKey(preferredKey) || `mod-${mod.id ?? Date.now()}`;
}

function cloneSerializableMod(mod: IModInfo) {
    return JSON.parse(JSON.stringify(mod)) as IModInfo;
}

async function createTempWorkDirectory(scope: string) {
    const workRoot = await join(
        await tempDir(),
        "gloss-mod-manager",
        scope,
        `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    );

    await FileHandler.deleteFolder(workRoot);
    await FileHandler.createDirectory(workRoot);
    return workRoot;
}

function parseGmmPackageDetails(rawContent: string, filePath: string) {
    const payload = JSON.parse(rawContent) as {
        info?: Partial<IInfo>;
        packs?: IModInfo[];
        name?: string;
        version?: string;
        description?: string;
        gameID?: number;
        author?: string;
    };

    return {
        filePath,
        info: {
            name: payload.info?.name || payload.name || "",
            version: payload.info?.version || payload.version || "1.0.0",
            description: payload.info?.description || payload.description || "",
            gameID: payload.info?.gameID || payload.gameID,
            author: payload.info?.author || payload.author || "",
        },
        packs: Array.isArray(payload.packs) ? payload.packs : [],
    } satisfies IGmmPackageDetails;
}

function resolvePackCoverForArchive(modRoot: string, cover?: string) {
    if (!cover || isHttpUrl(cover)) {
        return cover;
    }

    const normalizedCover = toLocalCoverPath(cover);

    if (!normalizedCover || isAbsoluteLocalPath(normalizedCover)) {
        return cover;
    }

    const normalizedModRoot = normalizeSlashes(modRoot);
    const normalizedAbsoluteCover = normalizeSlashes(
        cover.replace(/^file:\/*/iu, ""),
    );

    if (
        normalizedAbsoluteCover &&
        normalizedAbsoluteCover.startsWith(`${normalizedModRoot}/`)
    ) {
        return normalizedAbsoluteCover.slice(normalizedModRoot.length + 1);
    }

    return normalizedCover;
}

async function readPackageInfoFile(filePath: string) {
    const workDirectory = await createTempWorkDirectory("gmm-read");

    try {
        await SevenZip.extractArchive({
            archivePath: filePath,
            outputDirectory: workDirectory,
            includePatterns: ["info.json"],
        });

        const infoPath = await join(workDirectory, "info.json");

        if (!(await FileHandler.fileExists(infoPath))) {
            throw new Error("该 GMM 包缺少 info.json，无法继续。");
        }

        return await FileHandler.readFile(infoPath, "{}");
    } finally {
        await FileHandler.deleteFolder(workDirectory);
    }
}

function getSelectedPackList(
    packageDetails: IGmmPackageDetails,
    selectedFolderKeys?: string[],
) {
    const selectedKeySet =
        selectedFolderKeys && selectedFolderKeys.length > 0
            ? new Set(selectedFolderKeys)
            : null;

    return packageDetails.packs.filter((pack) => {
        if (!selectedKeySet) {
            return true;
        }

        return selectedKeySet.has(resolveGmmPackFolderKey(pack));
    });
}

export async function readGmmPackageDetails(filePath: string) {
    const rawContent = await readPackageInfoFile(filePath);
    return parseGmmPackageDetails(rawContent, filePath);
}

export async function installGmmPackage(options: IInstallGmmPackageOptions) {
    const packageDetails = await readGmmPackageDetails(options.filePath);

    if (
        options.manager.managerGame &&
        packageDetails.info.gameID &&
        Number(packageDetails.info.gameID) !==
            Number(options.manager.managerGame.GlossGameId)
    ) {
        throw new Error("该 GMM 包不属于当前游戏，请先切换到正确的游戏。");
    }

    const selectedPacks = getSelectedPackList(
        packageDetails,
        options.selectedFolderKeys,
    );

    if (selectedPacks.length === 0) {
        return {
            packageDetails,
            importedMods: [] as IModInfo[],
            skippedPacks: [] as IModInfo[],
        };
    }

    const workDirectory = await createTempWorkDirectory("gmm-install");

    try {
        await SevenZip.extractArchive({
            archivePath: options.filePath,
            outputDirectory: workDirectory,
        });

        const importSources: Array<{
            path: string;
            sourceType: "folder";
            metadata: Partial<IModInfo>;
        }> = [];
        const importedPacks: IModInfo[] = [];
        const skippedPacks: IModInfo[] = [];

        for (const pack of selectedPacks) {
            const folderKey = resolveGmmPackFolderKey(pack);
            const packFolder = await join(workDirectory, folderKey);

            if (!(await FileHandler.fileExists(packFolder))) {
                skippedPacks.push(pack);
                continue;
            }

            if (
                pack.md5 &&
                options.manager.managerModList.some((mod) => {
                    return Boolean(mod.md5) && mod.md5 === pack.md5;
                })
            ) {
                skippedPacks.push(pack);
                continue;
            }

            importSources.push({
                path: packFolder,
                sourceType: "folder",
                metadata: {
                    ...cloneSerializableMod(pack),
                    isInstalled: false,
                    cover: isHttpUrl(pack.cover) ? pack.cover : "",
                },
            });
            importedPacks.push(pack);
        }

        if (importSources.length === 0) {
            return {
                packageDetails,
                importedMods: [] as IModInfo[],
                skippedPacks,
            };
        }

        const result = await importLocalModSources(
            options.manager,
            importSources,
        );
        let shouldSaveCover = false;

        for (const [index, importedMod] of result.importedMods.entries()) {
            const sourcePack = importedPacks[index];
            const localCoverPath = toLocalCoverPath(sourcePack?.cover);

            if (
                !sourcePack ||
                !localCoverPath ||
                isHttpUrl(sourcePack.cover) ||
                isAbsoluteLocalPath(localCoverPath)
            ) {
                continue;
            }

            const coverPath = await join(
                options.manager.managerRoot,
                String(importedMod.id),
                localCoverPath,
            );
            const targetMod = options.manager.managerModList.find((mod) => {
                return mod.id === importedMod.id;
            });

            if (!targetMod) {
                continue;
            }

            targetMod.cover = coverPath;
            shouldSaveCover = true;
        }

        if (shouldSaveCover) {
            await options.manager.saveManagerData();
        }

        return {
            packageDetails,
            importedMods: result.importedMods,
            skippedPacks,
        };
    } finally {
        await FileHandler.deleteFolder(workDirectory);
    }
}

export async function createGmmPackage(options: {
    managerRoot: string;
    mods: IModInfo[];
    info: IInfo;
    outputPath: string;
}) {
    if (!options.managerRoot) {
        throw new Error("当前没有可用的 Mod 储存目录。");
    }

    if (options.mods.length === 0) {
        throw new Error("请先选择至少一个 Mod 再导出 GMM 包。");
    }

    const workDirectory = await createTempWorkDirectory("gmm-create");

    try {
        const packageMods: IModInfo[] = [];
        const sourceList = ["info.json"];

        for (const mod of options.mods) {
            const modRoot = await join(options.managerRoot, String(mod.id));
            const folderKey = resolveGmmPackFolderKey(mod);
            const targetFolder = await join(workDirectory, folderKey);

            if (!(await FileHandler.fileExists(modRoot))) {
                throw new Error(`未找到 Mod 目录：${mod.modName}`);
            }

            const copied = await FileHandler.copyFolder(modRoot, targetFolder);

            if (!copied) {
                throw new Error(`复制 Mod 文件失败：${mod.modName}`);
            }

            const packMod = cloneSerializableMod(mod);
            packMod.other = {
                ...(packMod.other ?? {}),
                gmmPackFolderKey: folderKey,
            };
            packMod.cover = resolvePackCoverForArchive(modRoot, packMod.cover);
            packageMods.push(packMod);
            sourceList.push(folderKey);
        }

        const packageInfo = {
            ...options.info,
            packs: packageMods,
        };
        const infoPath = await join(workDirectory, "info.json");
        const wroteInfo = await FileHandler.writeFile(
            infoPath,
            JSON.stringify(packageInfo, null, 4),
        );

        if (!wroteInfo) {
            throw new Error("写入 GMM 包信息失败。");
        }

        await SevenZip.createArchive({
            archivePath: options.outputPath,
            cwd: workDirectory,
            format: "zip",
            overwriteMode: "overwrite",
            sources: sourceList,
        });

        return {
            outputPath: options.outputPath,
            fileName: await basename(options.outputPath),
            packCount: packageMods.length,
        };
    } finally {
        await FileHandler.deleteFolder(workDirectory);
    }
}
