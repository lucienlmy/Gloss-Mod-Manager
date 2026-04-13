/**
 * @description 逃离鸭科夫 支持
 */

import { Manager } from "@/lib/Manager";
import { join, basename } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";

export const supportedGames = async () =>
    ({
        GlossGameId: 468,
        steamAppID: 3167020,
        installdir: await join("Escape from Duckov"),
        gameName: "Escape from Duckov",
        gameExe: [
            {
                name: "Duckov.exe",
                rootPath: await join("."),
            }, {
                name: "Duckov.app",
                rootPath: await join("."),
            }
        ],
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/3167020",
            },
            {
                name: "直接启动",
                exePath: await join("Duckov.exe"),
            },
        ],
        // archivePath: join(FileHandler.GetAppData(), "LocalLow", "Stunlock Studios", "VRising"),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_68f704683991c.png",
        modType: [
            {
                id: 1,
                name: "mods",
                installPath: await join("Duckov_Data", "mods"),
                async install(mod) {
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "info.ini",
                        true,
                    );
                },
                async uninstall(mod) {
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "info.ini",
                        false,
                    );
                },
            },
            {
                id: 99,
                name: "未知",
                installPath: "",
                async install(_mod) {
                    ElMessage.warning("未知类型, 请手动安装");
                    return false;
                },
                async uninstall(_mod) {
                    return true;
                },
            },
        ],
        async checkModType(mod) {
            let mods = false;

            for (const item of mod.modFiles) {
                if ((await basename(item)).toLowerCase() == "info.ini")
                    mods = true;
            }

            if (mods) return 1;

            return 99;
        },
    }) as ISupportedGames;
