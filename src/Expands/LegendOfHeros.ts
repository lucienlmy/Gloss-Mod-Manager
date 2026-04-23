import { basename, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";
import { UnityGameILCPP2 } from "@/lib/UnityGame";

let dictionaryList: string[] = [];
const portraitFolders = ["260x340", "1000x1400", "1024x1024"];

async function loadDictionary() {
    if (dictionaryList.length > 0) {
        return dictionaryList;
    }

    const response = await fetch("/res/ThreeKingdomDictionary.txt");
    const data = await response.text();
    dictionaryList = data
        .split(/\r?\n/u)
        .map((item) => item.trim())
        .filter((item) => item !== "");
    return dictionaryList;
}

async function handleDataMod(
    mod: IModInfo,
    installPath: string,
    isInstall: boolean,
) {
    try {
        const dictionary = await loadDictionary();
        const modStorage = await Manager.getModStoragePath(mod.id);
        const { gameStorage } = await Manager.getContext();

        if (!modStorage || !gameStorage) {
            return false;
        }

        const result: IState[] = [];
        for (const file of mod.modFiles) {
            try {
                const source = await join(modStorage, file);
                if (!(await FileHandler.isFile(source))) {
                    continue;
                }

                const name = await basename(file);
                const matchedPath = dictionary.find((item) =>
                    item.includes(name),
                );
                if (!matchedPath) {
                    continue;
                }

                const target = await join(
                    gameStorage,
                    installPath,
                    matchedPath,
                );
                if (isInstall) {
                    const state = await FileHandler.copyFile(source, target);
                    result.push({ file, state });
                } else {
                    const state = await FileHandler.deleteFile(target);
                    result.push({ file, state });
                }
            } catch {
                result.push({ file, state: false });
            }
        }

        return result;
    } catch (error) {
        ElMessage.error(`错误: ${error}`);
        return false;
    }
}

async function handlePortraits(
    mod: IModInfo,
    installPath: string,
    isInstall: boolean,
) {
    const modStorage = await Manager.getModStoragePath(mod.id);
    const { gameStorage } = await Manager.getContext();

    if (!modStorage || !gameStorage) {
        return false;
    }

    const folders = new Set<string>();
    for (const item of mod.modFiles) {
        const parts = FileHandler.pathToArray(item);
        const index = parts.findIndex((part) => portraitFolders.includes(part));
        if (index !== -1) {
            folders.add(await join(modStorage, ...parts.slice(0, index)));
        }
    }

    for (const folderPath of folders) {
        const target = await join(
            gameStorage,
            installPath,
            await basename(folderPath),
        );
        if (isInstall) {
            await FileHandler.createLink(folderPath, target);
        } else {
            await FileHandler.removeLink(target);
        }
    }

    return true;
}

/**
 * @description 英雄立志传：三国志 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 427,
        steamAppID: 3020510,
        installdir: await join("LegendOfHeros"),
        gameName: "Legend of Heroes Three Kingdoms",
        gameExe: "ThreeKingdom.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/3020510",
            },
            {
                name: "直接启动",
                exePath: "ThreeKingdom.exe",
            },
        ],
        archivePath: await join(
            await FileHandler.GetAppData(),
            "LocalLow",
            "FreeWing",
            "ThreeKingdom",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_67eca42846bf0.jpg",
        modType: [
            ...UnityGameILCPP2.modType,
            {
                id: 4,
                name: "Data",
                installPath: "",
                async install(mod) {
                    return handleDataMod(mod, this.installPath ?? "", true);
                },
                async uninstall(mod) {
                    return handleDataMod(mod, this.installPath ?? "", false);
                },
            },
            {
                id: 5,
                name: "Portraits",
                installPath: await join(
                    "ThreeKingdom_Data",
                    "StreamingAssets",
                    "Portraits",
                ),
                async install(mod) {
                    return handlePortraits(mod, this.installPath ?? "", true);
                },
                async uninstall(mod) {
                    return handlePortraits(mod, this.installPath ?? "", false);
                },
            },
        ],
        async checkModType(mod) {
            const dictionary = await loadDictionary();
            let streamingAssets = false;
            let portraits = false;

            for (const item of mod.modFiles) {
                const pathParts = FileHandler.pathToArray(item);
                if (pathParts.some((part) => portraitFolders.includes(part))) {
                    portraits = true;
                }

                const itemName = (await basename(item)).toLowerCase();
                const hasDictionaryMatch = (
                    await Promise.all(
                        dictionary.map(
                            async (dictionaryItem) =>
                                (
                                    await basename(dictionaryItem)
                                ).toLowerCase() === itemName,
                        ),
                    )
                ).some(Boolean);
                if (hasDictionaryMatch) {
                    streamingAssets = true;
                }
            }

            if (streamingAssets) return 4;
            if (portraits) return 5;

            return UnityGameILCPP2.checkModType(mod);
        },
    }) as ISupportedGames;
