import { basename, dirname, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 骑马与砍杀 2 支持
 */
async function getModFolder(mod: IModInfo) {
    const modStorage = await Manager.getModStoragePath(mod.id);

    if (!modStorage) {
        return "";
    }

    for (const item of mod.modFiles) {
        const modFilePath = await join(modStorage, item);
        if (
            (await FileHandler.isFile(modFilePath)) &&
            (await basename(modFilePath)).toLowerCase() === "submodule.xml"
        ) {
            return await dirname(modFilePath);
        }
    }

    return "";
}

async function handleMods(
    mod: IModInfo,
    installPath: string,
    isInstall: boolean,
) {
    const modFolder = await getModFolder(mod);
    const { gameStorage } = await Manager.getContext();

    if (!modFolder || !gameStorage) {
        return false;
    }

    const target = await join(
        gameStorage,
        installPath,
        await basename(modFolder),
    );
    return isInstall
        ? FileHandler.createLink(modFolder, target)
        : FileHandler.removeLink(target);
}

export const supportedGames = async () =>
    ({
        GlossGameId: 225,
        steamAppID: 261550,
        nexusMods: {
            game_domain_name: "mountandblade2bannerlord",
            game_id: 3174,
        },
        installdir: await join(
            "Mount & Blade II Bannerlord",
            "bin",
            "Win64_Shipping_Client",
        ),
        gameName: "MountBlade2",
        gameExe: [
            {
                name: "Bannerlord.exe",
                rootPath: ["..", ".."],
            },
        ],
        startExe: [
            {
                name: "steam 启动",
                cmd: "steam://rungameid/261550",
            },
            {
                name: "直接启动",
                exePath: await join(
                    "bin",
                    "Win64_Shipping_Client",
                    "TaleWorlds.MountAndBlade.Launcher.exe",
                ),
            },
        ],
        archivePath: await join(
            await FileHandler.getMyDocuments(),
            "Mount and Blade II Bannerlord",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/225.png",
        modType: [
            {
                id: 1,
                name: "Modules",
                installPath: "Modules",
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
                if ((await basename(item)).toLowerCase() === "submodule.xml") {
                    return 1;
                }
            }

            return 99;
        },
    }) as ISupportedGames;
