import { join, basename } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";

/**
 * @description X4：基石 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 178,
    steamAppID: 392160,
    installdir: await join("X4 Foundations"),
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
            exePath: await join("X4.exe"),
        },
    ],
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/178.png",
    modType: [
        {
            id: 1,
            name: "extensions",
            installPath: await join("extensions"),
            async install(mod) {
                void mod;
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
                void mod;
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
        let extensions = false;

        for (const item of mod.modFiles) {
            if ((await basename(item)).toLowerCase() == "content.xml")
                extensions = true;
        }

        if (extensions) return 1;

        return 99;
    },
}) as ISupportedGames;
