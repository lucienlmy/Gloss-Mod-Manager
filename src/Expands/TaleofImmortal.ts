import { basename, dirname, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 鬼谷八荒支持
 */
async function handlePlugins(
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
        if ((await basename(item)).toLowerCase() === "modexportdata.cache") {
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
        GlossGameId: 248,
        steamAppID: 1468810,
        nexusMods: {
            game_domain_name: "taleofimmortal",
            game_id: 4447,
        },
        installdir: "鬼谷八荒",
        gameName: "Tale of Immortal",
        gameExe: "guigubahuang.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1468810",
            },
        ],
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/603e05b7aef61.png",
        modType: [
            {
                id: 1,
                name: "通用",
                installPath: await join("ModExportData"),
                async install(mod) {
                    return handlePlugins(mod, this.installPath ?? "", true);
                },
                async uninstall(mod) {
                    return handlePlugins(mod, this.installPath ?? "", false);
                },
            },
            {
                id: 2,
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
            for (const item of mod.modFiles) {
                if (
                    (await basename(item)).toLowerCase() ===
                    "modexportdata.cache"
                ) {
                    return 1;
                }
            }

            return 2;
        },
    }) as ISupportedGames;
