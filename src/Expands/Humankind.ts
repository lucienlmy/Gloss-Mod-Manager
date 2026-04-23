import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 人类支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 330,
        steamAppID: 1124300,
        installdir: await join("Humankind"),
        gameName: "Humankind",
        gameExe: "Humankind.exe",
        mod_io: 2599,
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1124300",
            },
            {
                name: "直接启动",
                exePath: "Humankind.exe",
            },
        ],
        archivePath: await join(
            await FileHandler.getMyDocuments(),
            "Humankind",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/65a7365985d61.webp",
        modType: [
            {
                id: 1,
                name: "mods",
                installPath: await join(
                    await FileHandler.getMyDocuments(),
                    "Humankind",
                    "Community",
                    "Scenarios",
                ),
                async install(mod) {
                    const folderPath = await Manager.getModStoragePath(mod.id);
                    const destPath = await join(
                        this.installPath ?? "",
                        String(mod.id),
                    );

                    if (!folderPath) {
                        return false;
                    }

                    return FileHandler.createLink(folderPath, destPath, true);
                },
                async uninstall(mod) {
                    const target = await join(
                        this.installPath ?? "",
                        String(mod.id),
                    );
                    return FileHandler.removeLink(target, true);
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
        async checkModType(_mod) {
            return 1;
        },
    }) as ISupportedGames;
