import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";
import { FileHandler } from "@/lib/FileHandler";

/**
 * @description 纪元1800 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 189,
        steamAppID: 916440,
        installdir: await join("Anno 1800", "Bin", "Win64"),
        gameName: "Anno 1800",
        nexusMods: {
            game_domain_name: "anno1800",
            game_id: 2820,
        },
        gameExe: [
            {
                name: "Anno1800.exe",
                rootPath: ["..", ".."],
            },
        ],
        mod_io: 4169,
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/916440",
            },
            {
                name: "直接启动",
                exePath: await join("Bin", "Win64", "Anno1800.exe"),
            },
        ],
        archivePath: await join(
            await FileHandler.getMyDocuments(),
            "Anno 1800",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/189.png",
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
                        true,
                    );
                },
                async uninstall(mod) {
                    void mod;
                    return Manager.installByFolderParent(
                        mod,
                        this.installPath ?? "",
                        "data",
                        false,
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
