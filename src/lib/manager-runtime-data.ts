import { Manager } from "@/lib/Manager";

interface IManagerRuntimeDataStore {
    managerGame: ISupportedGames | null;
    managerRoot: string;
    managerModList: IModInfo[];
    tags: ITag[];
    selectedType: number | string | 0;
    selectedTag: string;
    availableTypes: IType[];
    textCollator: Intl.Collator;
}

function createTagColor(tagName: string) {
    let hash = 0;

    for (const char of tagName) {
        hash = (hash * 31 + char.charCodeAt(0)) % 360;
    }

    return `hsl(${Math.abs(hash)} 68% 46%)`;
}

function dedupeTags(
    list: Array<ITag | string | undefined>,
    textCollator: Intl.Collator,
) {
    const tagMap = new Map<string, ITag>();

    for (const item of list) {
        if (!item) {
            continue;
        }

        if (typeof item === "string") {
            const name = item.trim();

            if (!name) {
                continue;
            }

            tagMap.set(name, {
                name,
                color: createTagColor(name),
            });
            continue;
        }

        const name = item.name.trim();

        if (!name) {
            continue;
        }

        tagMap.set(name, {
            name,
            color: item.color || createTagColor(name),
        });
    }

    return [...tagMap.values()].sort((left, right) =>
        textCollator.compare(left.name, right.name),
    );
}

function normalizeMod(
    mod: Partial<IModInfo>,
    textCollator: Intl.Collator,
): IModInfo {
    return {
        id: Number(mod.id ?? Date.now()),
        modName: mod.modName || mod.fileName || `Mod ${mod.id ?? ""}`,
        fileName: mod.fileName || mod.modName || `mod-${mod.id ?? Date.now()}`,
        md5: mod.md5 || "",
        modVersion: mod.modVersion || "1.0.0",
        isUpdate: Boolean(mod.isUpdate),
        isInstalled: Boolean(mod.isInstalled),
        weight: typeof mod.weight === "number" ? mod.weight : 0,
        modFiles: Array.isArray(mod.modFiles) ? mod.modFiles : [],
        tags: dedupeTags(mod.tags ?? [], textCollator),
        modAuthor: mod.modAuthor ?? "",
        modWebsite: mod.modWebsite ?? "",
        modType: mod.modType ?? 99,
        modDesc: mod.modDesc ?? "",
        other: mod.other ?? {},
        from: mod.from,
        webId: mod.webId,
        cover: mod.cover,
        advanced: mod.advanced,
        key: mod.key,
        gameID: mod.gameID,
    };
}

function collectModTags(modList: IModInfo[], textCollator: Intl.Collator) {
    return dedupeTags(
        modList.flatMap((mod) => mod.tags ?? []),
        textCollator,
    );
}

export async function hydrateManagerRuntimeData(
    manager: IManagerRuntimeDataStore,
) {
    if (!manager.managerGame || !manager.managerRoot) {
        manager.managerModList = [];
        manager.tags = [];
        return;
    }

    try {
        const storedMods = (await Manager.getModInfo(
            manager.managerRoot,
        )) as IModInfo[];
        const storedTags = (await Manager.getModInfo(
            manager.managerRoot,
            "tags.json",
        )) as ITag[];
        const normalizedMods = storedMods.map((item) =>
            normalizeMod(item, manager.textCollator),
        );

        manager.managerModList = normalizedMods;
        manager.tags = dedupeTags(
            [
                ...storedTags,
                ...collectModTags(normalizedMods, manager.textCollator),
            ],
            manager.textCollator,
        );

        if (
            manager.selectedType !== 0 &&
            !manager.availableTypes.some(
                (item) => String(item.id) === String(manager.selectedType),
            )
        ) {
            manager.selectedType = 0;
        }

        if (
            manager.selectedTag !== "全部" &&
            !manager.tags.some((tag) => tag.name === manager.selectedTag)
        ) {
            manager.selectedTag = "全部";
        }
    } catch (error: unknown) {
        console.error("同步管理器运行时数据失败");
        console.error(error);
        manager.managerModList = [];
        manager.tags = [];
    }
}
