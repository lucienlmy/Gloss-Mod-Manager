import { basename, dirname, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 饥荒联机版支持
 */
async function handleMods(
    mod: IModInfo,
    installPath: string,
    isInstall: boolean,
) {
    const modStorage = await Manager.getModStoragePath(mod.id);
    const { gameStorage } = await Manager.getContext();

    if (!modStorage || !gameStorage) {
        return [] as IState[];
    }

    const installRoot = await join(gameStorage, installPath);
    const folders = new Set<string>();
    const result: IState[] = [];

    for (const item of mod.modFiles) {
        if ((await basename(item)).toLowerCase() === "modmain.lua") {
            folders.add(await dirname(await join(modStorage, item)));
        }
    }

    for (const folderPath of folders) {
        const target = await join(installRoot, await basename(folderPath));
        const state = isInstall
            ? await FileHandler.createLink(folderPath, target)
            : await FileHandler.removeLink(target);
        result.push({ file: folderPath, state });
    }

    return result;
}

export const supportedGames = async () =>
    ({
        GlossGameId: 14,
        steamAppID: 322330,
        nexusMods: {
            game_domain_name: "dontstarvetogether",
            game_id: 2709,
        },
        installdir: await join("Don't Starve Together", "bin"),
        gameName: "Don't Starve Together",
        gameExe: [
            {
                name: "dontstarve_steam.exe",
                rootPath: [".."],
            },
            {
                name: "dontstarve_steam_x64.exe",
                rootPath: [".."],
            },
        ],
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/322330",
            },
            {
                name: "启动 x32",
                exePath: await join("bin", "dontstarve_steam.exe"),
            },
            {
                name: "启动 x64",
                exePath: await join("bin64", "dontstarve_steam_x64.exe"),
            },
        ],
        archivePath: await join(await FileHandler.getMyDocuments(), "Klei"),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/14.jpg",
        modType: [
            {
                id: 1,
                name: "通用类型",
                installPath: await join("mods"),
                async install(mod) {
                    return handleMods(mod, this.installPath ?? "", true);
                },
                async uninstall(mod) {
                    return handleMods(mod, this.installPath ?? "", false);
                },
            },
            {
                id: 99,
                name: "未知",
                installPath: "",
                async install(_mod) {
                    ElMessage.warning(
                        "该 Mod 类型未知，无法自动安装，请手动安装。",
                    );
                    return false;
                },
                async uninstall(_mod) {
                    return true;
                },
            },
        ],
        async checkModType(mod) {
            for (const item of mod.modFiles) {
                if ((await basename(item)).toLowerCase() === "modmain.lua") {
                    return 1;
                }
            }

            return 99;
        },
    }) as ISupportedGames;
