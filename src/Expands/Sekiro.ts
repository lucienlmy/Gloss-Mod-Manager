/**
 * @description 只狼 安装支持
 */

import { Manager } from "@/lib/Manager";
import { basename, join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { ElMessage } from "element-plus-message";

let dictionaryList: string[] = [];

async function ensureDictionaryLoaded() {
    if (dictionaryList.length > 0) {
        return dictionaryList;
    }

    const response = await fetch("/res/SekiroDictionary.txt");

    if (!response.ok) {
        throw new Error("SekiroDictionary.txt 加载失败");
    }

    const dictionaryText = await response.text();
    dictionaryList = dictionaryText
        .split(/\r?\n/u)
        .map((item) => item.trim())
        .filter((item) => item !== "");

    return dictionaryList;
}

function createFailureState(mod: IModInfo) {
    return mod.modFiles.map((file) => ({
        file,
        state: false,
    }));
}

async function findDictionaryPath(filePath: string) {
    const fileName = (await basename(filePath)).toLowerCase();

    return (
        dictionaryList.find((item) => item.toLowerCase().includes(fileName)) ??
        null
    );
}

async function handleMod(
    mod: IModInfo,
    installPath: string,
    isInstall: boolean,
) {
    try {
        if (isInstall) {
            if (!Manager.checkInstalled("ModEngine", 71282)) {
                return false;
            }
        }

        await ensureDictionaryLoaded();

        const modStorageRoot = await Manager.getModStoragePath(mod.id);
        const { gameStorage } = await Manager.getContext();

        if (!modStorageRoot || !gameStorage) {
            ElMessage.warning(
                "未设置 Mod 储存目录或游戏目录，无法安装只狼 Mod。",
            );
            return createFailureState(mod);
        }

        const result: IState[] = [];

        for (const file of mod.modFiles) {
            try {
                const modStorage = await join(modStorageRoot, file);

                if (!(await FileHandler.isFile(modStorage))) {
                    result.push({ file, state: false });
                    continue;
                }

                const dictionaryPath = await findDictionaryPath(file);

                if (!dictionaryPath) {
                    result.push({ file, state: false });
                    continue;
                }

                const targetPath = await join(
                    gameStorage,
                    installPath,
                    dictionaryPath.replace(/^[/\\]+/u, ""),
                );

                if (isInstall) {
                    const state = await FileHandler.copyFile(
                        modStorage,
                        targetPath,
                    );

                    result.push({ file, state });
                } else {
                    const state = await FileHandler.deleteFile(targetPath);
                    result.push({ file, state });
                }
            } catch {
                result.push({ file, state: false });
            }
        }

        return result;
    } catch (error) {
        ElMessage.error(`错误:${error}`);
        return false;
    }
}

export const supportedGames = async () =>
    ({
        GlossGameId: 185,
        steamAppID: 814380,
        nexusMods: {
            game_domain_name: "sekiro",
            game_id: 2763,
        },
        installdir: "Sekiro",
        gameName: "Sekiro",
        gameExe: "sekiro.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/814380",
            },
            {
                name: "直接启动",
                exePath: "sekiro.exe",
            },
        ],
        archivePath: await join(
            await FileHandler.GetAppData(),
            "Roaming",
            "Sekiro",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/185.png",
        modType: [
            {
                id: 1,
                name: "基础类型",
                installPath: await join("mods"),
                install(mod) {
                    return handleMod(mod, this.installPath ?? "", true);
                },
                uninstall(mod) {
                    return handleMod(mod, this.installPath ?? "", false);
                },
            },
            {
                id: 2,
                name: "ModEngine",
                installPath: "",
                async install(mod) {
                    return Manager.installByFileSibling(
                        mod,
                        this.installPath ?? "",
                        "dinput8.dll",
                        true,
                    );
                    // Manager.generalInstall(mod, this.installPath ?? "")
                    // return true
                },
                async uninstall(mod) {
                    return Manager.installByFileSibling(
                        mod,
                        this.installPath ?? "",
                        "dinput8.dll",
                        false,
                    );
                    // Manager.generalUninstall(mod, this.installPath ?? "")
                    // return true
                },
            },
            {
                id: 99,
                name: "未知",
                installPath: "",
                async install(_) {
                    ElMessage.warning("未知类型, 请手动安装");
                    return false;
                },
                async uninstall(_) {
                    return true;
                },
            },
        ],
        async checkModType(mod) {
            // if (mod.webId == 71282) return 2

            await ensureDictionaryLoaded();

            let engine = false;
            let mods = false;

            for (const item of mod.modFiles) {
                if ((await basename(item)).toLowerCase() === "dinput8.dll") {
                    engine = true;
                }

                if (await findDictionaryPath(item)) {
                    mods = true;
                }
            }

            if (engine) return 2;
            if (mods) return 1;

            return 99;
        },
    }) as ISupportedGames;
