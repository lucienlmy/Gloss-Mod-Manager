import { join, basename } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";
import { FileHandler } from "@/lib/FileHandler";

/**
 * @description 天国 拯救 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 155,
        steamAppID: 379430,
        nexusMods: {
            game_domain_name: "kingdomcomedeliverance",
            game_id: 2298,
        },
        installdir: await join("KingdomComeDeliverance", "Bin", "Win64"),
        gameName: "Kingdom Come Deliverance",
        gameExe: [
            {
                name: "KingdomCome.exe",
                rootPath: await join("..", ".."),
            },
        ],
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/379430",
            },
            {
                name: "直接启动",
                exePath: await join("Bin", "Win64", "KingdomCome.exe"),
            },
        ],
        archivePath: await join(
            await FileHandler.GetAppData(),
            "..",
            "Saved Games",
            "kingdomcome",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/155.jpg",
        modType: [
            {
                id: 1,
                name: "Mods",
                installPath: await join("Mods"),
                async install(mod) {
                    void mod;
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "mod.manifest",
                        true,
                    );
                },
                async uninstall(mod) {
                    void mod;
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "mod.manifest",
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
            let mods = false;

            for (const item of mod.modFiles) {
                if (await basename(item) == "mod.manifest") mods = true;
            }

            if (mods) return 1;

            return 99;
        },
    }) as ISupportedGames;
