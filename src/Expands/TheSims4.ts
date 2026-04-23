import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 模拟人生 4 支持
 */
async function handleMod(mod: IModInfo, isInstall: boolean) {
    const srcPath = await Manager.getModStoragePath(mod.id);
    const destPath = await join(
        await FileHandler.getMyDocuments(),
        "Electronic Arts",
        "The Sims 4",
        "Mods",
        "Gloss Mod Manager",
        String(mod.id),
    );

    if (!srcPath) {
        return false;
    }

    return isInstall
        ? FileHandler.createLink(srcPath, destPath)
        : FileHandler.removeLink(destPath);
}

export const supportedGames = async () =>
    ({
        GlossGameId: 8,
        steamAppID: 1222670,
        nexusMods: {
            game_domain_name: "thesims4",
            game_id: 641,
        },
        installdir: await join("The Sims 4", "Game", "Bin"),
        gameName: "The Sims 4",
        curseforge: 78062,
        gameExe: [
            {
                name: "TS4_x64.exe",
                rootPath: ["..", ".."],
            },
        ],
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1222670",
            },
            {
                name: "直接启动",
                exePath: await join("Game", "Bin", "TS4_x64.exe"),
            },
        ],
        archivePath: await join(
            await FileHandler.getMyDocuments(),
            "Electronic Arts",
            "The Sims 4",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/8a.jpg",
        modType: [
            {
                id: 1,
                name: "通用类型",
                installPath: await join("The Sims 4", "Mods"),
                async install(mod) {
                    return handleMod(mod, true);
                },
                async uninstall(mod) {
                    return handleMod(mod, false);
                },
            },
        ],
        async checkModType(_mod) {
            return 1;
        },
    }) as ISupportedGames;
