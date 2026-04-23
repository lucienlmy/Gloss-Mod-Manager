import { basename, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

async function getModFolder(mod: IModInfo, mark: string, mark2: string) {
    const modStorage = await Manager.getModStoragePath(mod.id);

    if (!modStorage) {
        return "";
    }

    for (const item of mod.modFiles) {
        const itemParts = item.split("/");
        for (let index = 0; index < itemParts.length; index += 1) {
            const current = itemParts[index];
            if (!current.toLowerCase().includes(mark)) {
                continue;
            }

            const relativePath =
                current === mark2 ? itemParts.slice(0, index + 2) : [current];
            return await join(modStorage, ...relativePath);
        }
    }

    return "";
}

async function handleMods(
    mod: IModInfo,
    installPath: string,
    isInstall: boolean,
    mark: string,
    mark2: string = "mods",
) {
    const modFolder = await getModFolder(mod, mark, mark2);
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

/**
 * @description 巫师 3 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 4,
        steamAppID: 292030,
        nexusMods: {
            game_domain_name: "witcher3",
            game_id: 952,
        },
        installdir: await join("The Witcher 3", "bin", "x64"),
        gameName: "The Witcher 3",
        gameExe: [
            {
                name: "witcher3.exe",
                rootPath: ["..", ".."],
            },
        ],
        startExe: [
            {
                name: "steam 启动",
                cmd: "steam://rungameid/292030",
            },
            {
                name: "直接启动",
                exePath: await join("bin", "x64", "witcher3.exe"),
            },
        ],
        archivePath: await join(
            await FileHandler.getMyDocuments(),
            "The Witcher 3",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/4a.jpg",
        modType: [
            {
                id: 1,
                name: "mods",
                installPath: "mods",
                async install(mod) {
                    return handleMods(mod, this.installPath ?? "", true, "mod");
                },
                async uninstall(mod) {
                    return handleMods(
                        mod,
                        this.installPath ?? "",
                        false,
                        "mod",
                    );
                },
            },
            {
                id: 2,
                name: "dlc",
                installPath: "dlc",
                async install(mod) {
                    return handleMods(
                        mod,
                        this.installPath ?? "",
                        true,
                        "dlc",
                        "dlc",
                    );
                },
                async uninstall(mod) {
                    return handleMods(
                        mod,
                        this.installPath ?? "",
                        false,
                        "dlc",
                        "dlc",
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
            let mods = false;
            let dlc = false;

            for (const item of mod.modFiles) {
                const lowerCasePath = item.toLowerCase();
                if (lowerCasePath.includes("mod")) mods = true;
                if (lowerCasePath.includes("dlc")) dlc = true;
            }

            if (mods) return 1;
            if (dlc) return 2;

            return 99;
        },
    }) as ISupportedGames;
