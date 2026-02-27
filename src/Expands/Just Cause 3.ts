/**
 * @description 正当防卫3 支持
 */

import { join } from "node:path";
import { ElMessage } from "element-plus";

export const supportedGames: ISupportedGames = {
    GlossGameId: 50,
    steamAppID: 225540,
    nexusMods: {
        game_domain_name: "justcause3",
        game_id: 1946,
    },
    installdir: join("Just Cause 3"),
    gameName: "Just Cause 3",
    gameExe: "JustCause3.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/225540",
        },
        {
            name: "直接启动",
            exePath: join("JustCause3.exe"),
        },
    ],
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/50.jpg",
    modType: [
        {
            id: 1,
            name: "dropzone",
            installPath: join("dropzone"),
            async install(mod) {
                return Manager.installByFolder(
                    mod,
                    this.installPath ?? "",
                    "dropzone",
                    true,
                    false,
                );
            },
            async uninstall(mod) {
                return Manager.installByFolder(
                    mod,
                    this.installPath ?? "",
                    "dropzone",
                    false,
                    false,
                );
            },
        },
        {
            id: 2,
            name: "游戏根目录",
            installPath: "",
            async install(mod) {
                return Manager.generalInstall(
                    mod,
                    this.installPath ?? "",
                    true,
                );
            },
            async uninstall(mod) {
                return Manager.generalUninstall(
                    mod,
                    this.installPath ?? "",
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
        let dropzone = false;

        mod.modFiles.forEach((item) => {
            if (item.toLowerCase().includes("dropzone")) dropzone = true;
        });

        if (dropzone) return 1;

        return 99;
    },
};
