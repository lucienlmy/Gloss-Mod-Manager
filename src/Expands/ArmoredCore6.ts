import { basename, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

let dictionaryList: string[] = [];

async function loadDictionary() {
    if (dictionaryList.length > 0) {
        return dictionaryList;
    }

    const response = await fetch("/res/ArmoredCore6Dictionary.txt");
    const data = await response.text();
    dictionaryList = data
        .split(/\r?\n/u)
        .map((item) => item.trim())
        .filter((item) => item !== "");
    return dictionaryList;
}

/**
 * @description 装甲核心 6 支持
 */
async function handleMod(
    mod: IModInfo,
    installPath: string,
    isInstall: boolean,
) {
    try {
        if (isInstall && !Manager.checkInstalled("ModEngine2", 197418)) {
            return false;
        }

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

export const supportedGames = async () =>
    ({
        GlossGameId: 323,
        steamAppID: 1888160,
        nexusMods: {
            game_domain_name: "armoredcore6firesofrubicon",
            game_id: 5679,
        },
        installdir: await join("ARMORED CORE VI FIRES OF RUBICON", "Game"),
        gameName: "Armored Core 6",
        gameExe: "armoredcore6.exe",
        startExe: [
            {
                name: "启动 激活 Mod",
                exePath: "launchmod_armoredcore6.bat",
            },
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1888160",
            },
        ],
        archivePath: await join(
            await FileHandler.GetAppData(),
            "Roaming",
            "ArmoredCore6",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/64e5a555a4360.webp",
        modType: [
            {
                id: 1,
                name: "通用类型",
                installPath: "mods",
                async install(mod) {
                    return handleMod(mod, this.installPath ?? "", true);
                },
                async uninstall(mod) {
                    return handleMod(mod, this.installPath ?? "", false);
                },
            },
            {
                id: 2,
                name: "Engine 2",
                installPath: "",
                async install(mod) {
                    return Manager.generalInstall(
                        mod,
                        this.installPath ?? "",
                        true,
                    );
                },
                async uninstall(mod) {
                    return Manager.generalUninstall(
                        mod,
                        this.installPath ?? "",
                        true,
                    );
                },
            },
        ],
        async checkModType(mod) {
            if (mod.webId === 197418) {
                return 2;
            }

            return 1;
        },
    }) as ISupportedGames;
