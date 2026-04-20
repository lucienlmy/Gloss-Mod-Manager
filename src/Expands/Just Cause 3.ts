import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";

/**
 * @description 正当防卫3 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 50,
    steamAppID: 225540,
    nexusMods: {
        game_domain_name: "justcause3",
        game_id: 1946,
    },
    installdir: await join("Just Cause 3"),
    gameName: "Just Cause 3",
    gameExe: "JustCause3.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/225540",
        },
        {
            name: "直接启动",
            exePath: await join("JustCause3.exe"),
        },
    ],
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/50.jpg",
    modType: [
        {
            id: 1,
            name: "dropzone",
            installPath: await join("dropzone"),
            async install(mod) {
                void mod;
                return Manager.installByFolder(
                    mod,
                    this.installPath ?? "",
                    "dropzone",
                    true,
                    false,
                );
            },
            async uninstall(mod) {
                void mod;
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
                void mod;
                return Manager.generalInstall(
                    mod,
                    this.installPath ?? "",
                    true,
                );
            },
            async uninstall(mod) {
                void mod;
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
                void mod;
                ElMessage.warning("未知类型, 请手动安装");
                return false;
            },
            async uninstall(mod) {
                void mod;
                return true;
            },
        },
    ],
    async checkModType(mod) {
        let dropzone = false;

        for (const item of mod.modFiles) {
            if (item.toLowerCase().includes("dropzone")) dropzone = true;
        }

        if (dropzone) return 1;

        return 99;
    },
}) as ISupportedGames;
