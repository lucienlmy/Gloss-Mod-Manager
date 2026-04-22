export type TCustomGameModTypeTemplate =
    | "UnityGame.modType"
    | "UnityGameILCPP2.modType"
    | "UnrealEngine.modType"
    | "Custom";

export type TCustomGameCheckTypeTemplate =
    | "UnityGame.checkModType"
    | "UnityGameILCPP2.checkModType"
    | "UnrealEngine.checkModType"
    | "Custom";

export function createEmptyTypeInstall(isInstall: boolean): ITypeInstall {
    return {
        UseFunction: "Unknown",
        folderName: "",
        fileName: "",
        isInstall,
        include: false,
        spare: false,
        keepPath: false,
        isExtname: false,
        inGameStorage: true,
        pass: [],
    };
}

export function createEmptyCheckRule(typeId?: number): ICheckModType {
    return {
        UseFunction: "extname",
        Keyword: [],
        TypeId: typeId,
    };
}

export function createEmptyCustomType(): IExpandsType {
    return {
        name: "",
        installPath: "",
        local: true,
        install: createEmptyTypeInstall(true),
        uninstall: createEmptyTypeInstall(false),
        checkModType: createEmptyCheckRule(),
    };
}

export function createEmptyGameCustomType(nextId: number = 1): IType {
    return {
        id: nextId,
        name: "",
        installPath: "",
        install: createEmptyTypeInstall(true),
        uninstall: createEmptyTypeInstall(false),
    };
}

export function cloneDefinition<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

export function splitRelativePath(value: string) {
    return value
        .replace(/[\\/]+/gu, "/")
        .split("/")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function joinRelativePath(parts: string[]) {
    return parts.filter(Boolean).join("/");
}

export function parseKeywordText(value: string) {
    return value
        .split(/[\n,，]/u)
        .map((item) => item.trim())
        .filter(Boolean);
}

export function formatKeywordText(value: string[] | undefined) {
    return (value ?? []).join(", ");
}
