/**
 * @description X4：基石 支持
 */

import { join, basename } from "node:path";

export const supportedGames: ISupportedGames = {
    GlossGameId: 178,
    steamAppID: 392160,
    installdir: join("X4 Foundations"),
    gameName: "X4 Foundations",
    gameExe: "X4.exe",
    nexusMods: {
        game_domain_name: "x4foundations",
        game_id: 2659,
    },
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/392160",
        },
        {
            name: "直接启动",
            exePath: join("X4.exe"),
        },
    ],
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/178.png",
    modType: [
        {
            id: 1,
            name: "extensions",
            installPath: join("extensions"),
            async install(mod) {
                return Manager.installByFile(
                    mod,
                    this.installPath ?? "",
                    "content.xml",
                    true,
                    false,
                    true,
                );
            },
            async uninstall(mod) {
                return Manager.installByFile(
                    mod,
                    this.installPath ?? "",
                    "content.xml",
                    false,
                    false,
                    true,
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
        let extensions = false;

        mod.modFiles.forEach((item) => {
            if (basename(item).toLowerCase() == "content.xml")
                extensions = true;
        });

        if (extensions) return 1;

        return 99;
    },
};
