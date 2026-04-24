interface IImportGmmShareCodeOptions {
    manager: ReturnType<typeof useManager>;
    code: string;
}

interface IShareCodeImportMatchResult {
    addedCount: number;
    updatedCount: number;
    skippedCount: number;
    totalCount: number;
}

function toBase64Bytes(base64Code: string) {
    const normalizedCode = base64Code
        .trim()
        .replace(/-/gu, "+")
        .replace(/_/gu, "/")
        .replace(/\s+/gu, "");
    const paddingLength = normalizedCode.length % 4;
    const paddedCode =
        paddingLength === 0
            ? normalizedCode
            : `${normalizedCode}${"=".repeat(4 - paddingLength)}`;
    const binary = atob(paddedCode);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
}

function normalizeShareCode(code: string) {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
        throw new Error("分享码不能为空。");
    }

    return trimmedCode;
}

export function parseGmmShareCode(code: string) {
    const decoder = new TextDecoder();
    const rawPayload = decoder.decode(toBase64Bytes(normalizeShareCode(code)));
    const payload = JSON.parse(rawPayload) as IModInfo[];

    if (!Array.isArray(payload)) {
        throw new Error("分享码格式不正确。");
    }

    return payload;
}

function resolveShareCodeMatchIndex(
    manager: ReturnType<typeof useManager>,
    incomingMod: IModInfo,
) {
    return manager.managerModList.findIndex((item) => {
        if (
            incomingMod.webId !== undefined &&
            incomingMod.webId !== "" &&
            item.webId !== undefined &&
            String(item.webId) === String(incomingMod.webId)
        ) {
            return item.from === incomingMod.from;
        }

        if (
            incomingMod.other?.namespace &&
            item.other?.namespace === incomingMod.other.namespace &&
            item.modName === incomingMod.modName
        ) {
            return true;
        }

        return Boolean(incomingMod.md5) && incomingMod.md5 === item.md5;
    });
}

function buildNextModId(manager: ReturnType<typeof useManager>) {
    const currentMaxId = manager.managerModList.reduce((maxId, item) => {
        return Math.max(maxId, Number(item.id) || 0);
    }, 0);

    return currentMaxId + 1;
}

export async function importGmmShareCode(
    options: IImportGmmShareCodeOptions,
): Promise<IShareCodeImportMatchResult> {
    const shareMods = parseGmmShareCode(options.code);
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let nextModId = buildNextModId(options.manager);

    for (const shareMod of shareMods) {
        const normalizedIncoming = options.manager.normalizeMod({
            ...shareMod,
            id: shareMod.id || nextModId,
            isInstalled: false,
            modFiles: [],
            weight: 0,
        });
        const matchedIndex = resolveShareCodeMatchIndex(
            options.manager,
            normalizedIncoming,
        );

        if (matchedIndex === -1) {
            options.manager.managerModList = [
                ...options.manager.managerModList,
                options.manager.normalizeMod({
                    ...normalizedIncoming,
                    id: nextModId,
                    weight: options.manager.managerModList.length + 1,
                }),
            ];
            addedCount += 1;
            nextModId += 1;
            continue;
        }

        const currentMod = options.manager.managerModList[matchedIndex];

        if (currentMod.modVersion === normalizedIncoming.modVersion) {
            skippedCount += 1;
            continue;
        }

        options.manager.managerModList = options.manager.managerModList.map(
            (item, index) => {
                if (index !== matchedIndex) {
                    return item;
                }

                return options.manager.normalizeMod({
                    ...item,
                    modName: normalizedIncoming.modName,
                    modVersion: normalizedIncoming.modVersion,
                    modAuthor: normalizedIncoming.modAuthor,
                    modWebsite: normalizedIncoming.modWebsite,
                    tags: normalizedIncoming.tags,
                    modType: normalizedIncoming.modType,
                    modDesc: normalizedIncoming.modDesc,
                    cover: normalizedIncoming.cover,
                    other: {
                        ...item.other,
                        ...normalizedIncoming.other,
                    },
                    from: normalizedIncoming.from,
                    webId: normalizedIncoming.webId,
                    gameID: normalizedIncoming.gameID,
                    key: normalizedIncoming.key,
                    advanced: normalizedIncoming.advanced,
                    isInstalled: false,
                });
            },
        );
        updatedCount += 1;
    }

    options.manager.syncTagsFromMods();
    await options.manager.saveManagerData();

    return {
        addedCount,
        updatedCount,
        skippedCount,
        totalCount: shareMods.length,
    };
}
