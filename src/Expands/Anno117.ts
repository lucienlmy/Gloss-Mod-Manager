import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";
import { FileHandler } from "@/lib/FileHandler";

/**
 * @description 纪元1800 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 473,
    steamAppID: 3274580,
    installdir: await join("Anno 117 - Pax Romana", "Bin", "Anno117"),
    gameName: "Anno 117 - Pax Romana",
    nexusMods: {
        game_domain_name: "anno117paxromana",
        game_id: 8155,
    },
    gameExe: [
        {
            name: "Anno117.exe",
            rootPath: await join("..", ".."),
        },
    ],
    mod_io: 11358,
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/3274580",
        },
        {
            name: "直接启动",
            exePath: await join("Bin", "Anno117", "Anno117.exe"),
        },
    ],
    archivePath: await join(await FileHandler.getMyDocuments(), "Anno 1800"),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_690ab14576ba4.png",
    modType: [
        {
            id: 1,
            name: "mods",
            installPath: await join("mods"),
            async install(mod) {
                void mod;
                return Manager.installByFolderParent(
                    mod,
                    this.installPath ?? "",
                    "data",
                    true
                );
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFolderParent(
                    mod,
                    this.installPath ?? "",
                    "data",
                    false
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
        // let loader = false
        let mods = false;

        for (const item of mod.modFiles) {
            // if (basename(item) == 'python35.dll') loader = true
            // 判断路径是否包含 data
            if (item.includes("data")) mods = true;
        }

        // if (loader) return 1
        if (mods) return 1;

        return 99;
    },
}) as ISupportedGames;
