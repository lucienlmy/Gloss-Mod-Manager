import { basename, dirname, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 边缘世界支持
 */
async function handleMod(
    mod: IModInfo,
    installPath: string,
    isInstall: boolean,
) {
    const modStorage = await Manager.getModStoragePath(mod.id);
    const { gameStorage } = await Manager.getContext();

    if (!modStorage || !gameStorage) {
        return false;
    }

    const modBaseFolders: string[] = [];
    for (const item of mod.modFiles) {
        const filePath = await join(modStorage, item);
        if ((await basename(filePath)).toLowerCase() === "about.xml") {
            modBaseFolders.push(await dirname(await dirname(filePath)));
        }
    }

    if (modBaseFolders.length === 0) {
        ElMessage.error("未找到 about.xml 文件，无法安装。");
        return false;
    }

    for (const folderPath of modBaseFolders) {
        const destPath = await join(
            gameStorage,
            installPath,
            await basename(folderPath),
        );
        if (isInstall) {
            await FileHandler.createLink(folderPath, destPath);
        } else {
            await FileHandler.removeLink(destPath);
        }
    }

    return true;
}

export const supportedGames = async () =>
    ({
        GlossGameId: 19,
        steamAppID: 294100,
        nexusMods: {
            game_domain_name: "rimworld",
            game_id: 424,
        },
        installdir: await join("RimWorld"),
        gameName: "RimWorld",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/294100",
            },
            {
                name: "直接启动",
                exePath: "RimWorldWin64.exe",
            },
        ],
        gameExe: "RimWorldWin64.exe",
        archivePath: await join(
            await FileHandler.GetAppData(),
            "LocalLow",
            "Ludeon Studios",
            "RimWorld by Ludeon Studios",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/19.jpg",
        modType: [
            {
                id: 1,
                name: "通用类型",
                installPath: "Mods",
                async install(mod) {
                    return handleMod(mod, this.installPath ?? "", true);
                },
                async uninstall(mod) {
                    return handleMod(mod, this.installPath ?? "", false);
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
                if ((await basename(item)).toLowerCase() === "about.xml") {
                    return 1;
                }
            }

            return 99;
        },
    }) as ISupportedGames;
