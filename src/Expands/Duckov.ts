/**
 * @description 逃离鸭科夫 支持
 */

import { Manager } from "@/model/Manager";
import { join, basename } from "node:path";

export const supportedGames: ISupportedGames = {
    GlossGameId: 468,
    steamAppID: 3167020,
    installdir: join("Escape from Duckov"),
    gameName: "Escape from Duckov",
    gameExe: "Duckov.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/3167020",
        },
        {
            name: "直接启动",
            exePath: join("Duckov.exe"),
        },
    ],
    // archivePath: join(FileHandler.GetAppData(), "LocalLow", "Stunlock Studios", "VRising"),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_68f704683991c.png",
    modType: [
        {
            id: 1,
            name: "mods",
            installPath: join("Duckov_Data", "mods"),
            async install(mod) {
                return Manager.installByFile(
                    mod,
                    this.installPath ?? "",
                    "info.ini",
                    true
                );
            },
            async uninstall(mod) {
                return Manager.installByFile(
                    mod,
                    this.installPath ?? "",
                    "info.ini",
                    false
                );
            },
        },
        {
            id: 99,
            name: "未知",
            installPath: "",
            async install(mod) {
                ElMessage.warning("未知类型, 请手动安装");
                return false;
            },
            async uninstall(mod) {
                return true;
            },
        },
    ],
    checkModType(mod) {
        let mods = false;

        mod.modFiles.forEach((item) => {
            if (basename(item).toLowerCase() == "info.ini") mods = true;
        });

        if (mods) return 1;

        return 99;
    },
};
