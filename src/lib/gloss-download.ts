export interface IGlossDownloadTaskMeta {
    sourceType?: sourceType;
    externalId?: number | string;
    modId?: number;
    resourceId?: number | string;
    replaceLocalModId?: number;
    resourceFormat?: string;
    modTitle?: string;
    gameName?: string;
    resourceName?: string;
    fileName?: string;
    author?: string;
    version?: string;
    cover?: string;
    content?: string;
    sourceUrl?: string;
    downloadUrl?: string;
    localModId?: number;
    createdAt?: string;
    importedAt?: string;
    taskStatus?: TaskStatus;
    downloadedAt?: string;
    updatedAt?: string;
}

export type GlossDownloadPresence =
    | "none"
    | "active"
    | "waiting"
    | "paused"
    | "error"
    | "complete"
    | "imported";

export interface IGlossDuplicateCriteria {
    sourceType?: sourceType;
    externalId?: number | string;
    modId?: number | string;
    resourceId?: number | string;
    downloadUrl?: string;
    fileName?: string;
    modTitle?: string;
}

export interface IGlossDuplicateTaskMatch {
    gid: string;
    meta: IGlossDownloadTaskMeta;
    score: number;
}

export interface IGlossDuplicateLocalModMatch {
    mod: IModInfo;
    reason: string;
    score: number;
}

interface IGlossPresenceSummary {
    state: GlossDownloadPresence;
    label: string;
    taskCount: number;
    localCount: number;
}

const taskPriorityMap: Record<Exclude<TaskStatus, "removed">, number> = {
    active: 500,
    waiting: 400,
    paused: 300,
    error: 250,
    complete: 100,
};

const presencePriorityMap: Record<GlossDownloadPresence, number> = {
    none: 0,
    complete: 100,
    imported: 180,
    error: 250,
    paused: 300,
    waiting: 400,
    active: 500,
};

const presenceLabelMap: Record<GlossDownloadPresence, string> = {
    none: "加入下载",
    active: "下载中",
    waiting: "排队中",
    paused: "已暂停",
    error: "下载失败",
    complete: "已下载",
    imported: "已在本地",
};

export function normalizeCompareText(value?: string) {
    return (value ?? "").trim().toLowerCase().replace(/\s+/gu, " ");
}

function isSameId(left?: number | string, right?: number | string) {
    if (
        left === undefined ||
        right === undefined ||
        left === "" ||
        right === ""
    ) {
        return false;
    }

    return String(left) === String(right);
}

function getTaskExternalId(meta: IGlossDownloadTaskMeta) {
    return meta.externalId ?? meta.modId;
}

function getCriteriaExternalId(criteria: IGlossDuplicateCriteria) {
    return criteria.externalId ?? criteria.modId;
}

function getTaskMatchScore(
    meta: IGlossDownloadTaskMeta,
    criteria: IGlossDuplicateCriteria,
) {
    const criteriaExternalId = getCriteriaExternalId(criteria);
    const taskExternalId = getTaskExternalId(meta);
    const sourceTypeConflict =
        criteria.sourceType &&
        meta.sourceType &&
        criteria.sourceType !== meta.sourceType;

    if (sourceTypeConflict) {
        return 0;
    }

    const resourceMatched = isSameId(meta.resourceId, criteria.resourceId);
    const downloadUrlMatched =
        Boolean(criteria.downloadUrl) &&
        normalizeCompareText(meta.downloadUrl) ===
            normalizeCompareText(criteria.downloadUrl);
    const externalIdMatched = isSameId(taskExternalId, criteriaExternalId);
    const fileNameMatched =
        Boolean(criteria.fileName) &&
        normalizeCompareText(meta.fileName) ===
            normalizeCompareText(criteria.fileName);
    const modTitleMatched =
        Boolean(criteria.modTitle) &&
        normalizeCompareText(meta.modTitle) ===
            normalizeCompareText(criteria.modTitle);
    const sourceTypeMatched =
        Boolean(criteria.sourceType && meta.sourceType) &&
        criteria.sourceType === meta.sourceType;
    let score = 0;
    let hasPrimaryIdentityMatch = false;

    if (resourceMatched) {
        score += 80;
        hasPrimaryIdentityMatch = true;
    }

    if (downloadUrlMatched) {
        score += 60;
        hasPrimaryIdentityMatch = true;
    }

    if (
        externalIdMatched &&
        (!criteria.sourceType || !meta.sourceType || sourceTypeMatched)
    ) {
        score += 40;
        hasPrimaryIdentityMatch = true;
    }

    if (fileNameMatched && (hasPrimaryIdentityMatch || modTitleMatched)) {
        score += 20;
    }

    if (modTitleMatched && (hasPrimaryIdentityMatch || fileNameMatched)) {
        score += 10;
    }

    if (sourceTypeMatched && (hasPrimaryIdentityMatch || fileNameMatched)) {
        score += 20;
    }

    return score;
}

export function findGlossDuplicateTasks(
    taskMetaMap: Record<string, IGlossDownloadTaskMeta>,
    criteria: IGlossDuplicateCriteria,
) {
    return Object.entries(taskMetaMap)
        .map(([gid, meta]) => ({
            gid,
            meta,
            score: getTaskMatchScore(meta, criteria),
        }))
        .filter((item) => item.score > 0)
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            const leftPriority = left.meta.taskStatus
                ? (taskPriorityMap[
                      left.meta.taskStatus as Exclude<TaskStatus, "removed">
                  ] ?? 0)
                : 0;
            const rightPriority = right.meta.taskStatus
                ? (taskPriorityMap[
                      right.meta.taskStatus as Exclude<TaskStatus, "removed">
                  ] ?? 0)
                : 0;

            return rightPriority - leftPriority;
        });
}

function getLocalModMatchScore(
    mod: IModInfo,
    criteria: IGlossDuplicateCriteria,
) {
    const normalizedFileName = normalizeCompareText(criteria.fileName);
    const normalizedTitle = normalizeCompareText(criteria.modTitle);
    const criteriaExternalId = getCriteriaExternalId(criteria);
    const normalizedSourceType = criteria.sourceType?.trim();

    if (
        normalizedSourceType &&
        mod.from === normalizedSourceType &&
        isSameId(mod.webId, criteriaExternalId)
    ) {
        return {
            score: 100,
            reason: "同一来源 Mod",
        };
    }

    if (
        !normalizedSourceType &&
        mod.from === "GlossMod" &&
        isSameId(mod.webId, criteria.modId)
    ) {
        return {
            score: 100,
            reason: "同一 Gloss Mod",
        };
    }

    if (
        normalizedFileName &&
        normalizeCompareText(mod.fileName) === normalizedFileName
    ) {
        return {
            score: 60,
            reason: "文件名重复",
        };
    }

    if (
        normalizedTitle &&
        normalizeCompareText(mod.modName) === normalizedTitle
    ) {
        return {
            score: 40,
            reason: "标题重复",
        };
    }

    return {
        score: 0,
        reason: "",
    };
}

export function findGlossDuplicateLocalMods(
    managerModList: IModInfo[],
    criteria: IGlossDuplicateCriteria,
) {
    return managerModList
        .map((mod) => {
            const matched = getLocalModMatchScore(mod, criteria);

            return {
                mod,
                reason: matched.reason,
                score: matched.score,
            };
        })
        .filter((item) => item.score > 0)
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            return Number(left.mod.id) - Number(right.mod.id);
        });
}

function resolveTaskPresence(matches: IGlossDuplicateTaskMatch[]) {
    let state: GlossDownloadPresence = "none";

    for (const item of matches) {
        const taskStatus = item.meta.taskStatus;

        if (!taskStatus || taskStatus === "removed") {
            continue;
        }

        if (presencePriorityMap[taskStatus] > presencePriorityMap[state]) {
            state = taskStatus;
        }
    }

    return state;
}

export function getGlossModPresence(
    taskMetaMap: Record<string, IGlossDownloadTaskMeta>,
    managerModList: IModInfo[],
    criteria: IGlossDuplicateCriteria,
): IGlossPresenceSummary {
    const taskMatches = findGlossDuplicateTasks(taskMetaMap, criteria).filter(
        (item) => item.meta.taskStatus !== "removed",
    );
    const localMatches = findGlossDuplicateLocalMods(managerModList, criteria);

    let state: GlossDownloadPresence = resolveTaskPresence(taskMatches);

    if (
        localMatches.length > 0 &&
        presencePriorityMap.imported > presencePriorityMap[state]
    ) {
        state = "imported";
    }

    return {
        state,
        label: presenceLabelMap[state],
        taskCount: taskMatches.length,
        localCount: localMatches.length,
    };
}

export function buildUniqueGlossFileName(
    fileName: string,
    existingNames: string[],
) {
    const normalizedNames = new Set(
        existingNames.map((item) => normalizeCompareText(item)),
    );
    const normalizedFileName = normalizeCompareText(fileName);

    if (!normalizedNames.has(normalizedFileName)) {
        return fileName;
    }

    const lastDotIndex = fileName.lastIndexOf(".");
    const hasExtension = lastDotIndex > 0;
    const baseName = hasExtension ? fileName.slice(0, lastDotIndex) : fileName;
    const extension = hasExtension ? fileName.slice(lastDotIndex) : "";

    let index = 2;

    while (true) {
        const candidate = `${baseName} (${index})${extension}`;

        if (!normalizedNames.has(normalizeCompareText(candidate))) {
            return candidate;
        }

        index += 1;
    }
}
