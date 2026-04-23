import { basename, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 如龙 8 支持
 */
async function runSRMM() {
    const { gameStorage } = await Manager.getContext();

    if (!gameStorage) {
        return;
    }

    await FileHandler.runExe(await join(gameStorage, "RyuModManager.exe"));
}

export const supportedGames = async () =>
    ({
        GlossGameId: 334,
        steamAppID: 2072450,
        installdir: await join("LikeADragon8", "runtime", "media"),
        gameName: "LikeADragon8",
        gameExe: "likeadragon8.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/2072450",
            },
            {
                name: "直接启动",
                exePath: "likeadragon8.exe",
            },
        ],
        archivePath: await join(
            await FileHandler.GetAppData(),
            "Local",
            "SEGA",
            "LikeADragon8",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/65b9e51412790.webp",
        modType: [
            {
                id: 1,
                name: "mods",
                installPath: await join("mods"),
                async install(mod) {
                    if (!Manager.checkInstalled("Shin Ryu Mod Manager", 206132))
                        return false;

                    await Manager.generalInstall(
                        mod,
                        this.installPath ?? "",
                        true,
                    );
                    await runSRMM();
                    return true;
                },
                async uninstall(mod) {
                    await Manager.generalUninstall(
                        mod,
                        this.installPath ?? "",
                        true,
                    );
                    await runSRMM();
                    return true;
                },
            },
            {
                id: 2,
                name: "RyuModManager",
                installPath: "",
                async install(mod) {
                    return Manager.installByFileSibling(
                        mod,
                        this.installPath ?? "",
                        "RyuModManager.exe",
                        true,
                    );
                },
                async uninstall(mod) {
                    return Manager.installByFileSibling(
                        mod,
                        this.installPath ?? "",
                        "RyuModManager.exe",
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
            for (const item of mod.modFiles) {
                if ((await basename(item)) === "RyuModManager.exe") {
                    return 2;
                }
            }

            return 1;
        },
    }) as ISupportedGames;
