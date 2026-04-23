import { basename, dirname, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 恐怖黎明支持
 */
async function handleMods(
    mod: IModInfo,
    installPath: string,
    isInstall: boolean,
) {
    const modStorage = await Manager.getModStoragePath(mod.id);
    const { gameStorage } = await Manager.getContext();

    if (!modStorage || !gameStorage) {
        return false;
    }

    const installRoot = await join(gameStorage, installPath);
    const folders = new Set<string>();
    const folderList = ["resources", "database", "localization"];

    for (const item of mod.modFiles) {
        if (folderList.includes((await basename(item)).toLowerCase())) {
            folders.add(await dirname(await join(modStorage, item)));
        }
    }

    for (const folderPath of folders) {
        const target = await join(installRoot, await basename(folderPath));
        if (isInstall) {
            await FileHandler.createLink(folderPath, target);
        } else {
            await FileHandler.removeLink(target);
        }
    }

    return true;
}

export const supportedGames = async () =>
    ({
        GlossGameId: 80,
        steamAppID: 219990,
        nexusMods: {
            game_id: 1190,
            game_domain_name: "grimdawn",
        },
        installdir: await join("Grim Dawn"),
        gameName: "Grim Dawn",
        gameExe: "Grim Dawn.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/219990",
            },
            {
                name: "直接启动",
                exePath: "Grim Dawn.exe",
            },
        ],
        archivePath: await join(
            await FileHandler.getMyDocuments(),
            "My Games",
            "Grim Dawn",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/80.jpg",
        modType: [
            {
                id: 1,
                name: "mods",
                installPath: await join("mods"),
                async install(mod) {
                    return handleMods(mod, this.installPath ?? "", true);
                },
                async uninstall(mod) {
                    return handleMods(mod, this.installPath ?? "", false);
                },
            },
            {
                id: 2,
                name: "游戏根目录",
                installPath: "",
                async install(mod) {
                    return Manager.generalInstall(
                        mod,
                        this.installPath ?? "",
                        false,
                    );
                },
                async uninstall(mod) {
                    return Manager.generalUninstall(
                        mod,
                        this.installPath ?? "",
                        false,
                    );
                },
            },
            {
                id: 99,
                name: "未知",
                installPath: "",
                async install(_mod) {
                    ElMessage.warning("未知类型，请手动安装");
                    return false;
                },
                async uninstall(_mod) {
                    return true;
                },
            },
        ],
        async checkModType(mod) {
            const folderList = ["resources", "database", "localization"];

            for (const item of mod.modFiles) {
                const pathParts = FileHandler.pathToArray(item).map((part) =>
                    part.toLowerCase(),
                );
                if (pathParts.some((part) => folderList.includes(part))) {
                    return 1;
                }
            }

            return 99;
        },
    }) as ISupportedGames;
