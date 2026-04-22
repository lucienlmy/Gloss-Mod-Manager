import { join, basename } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";

/**
 * @description 暗黑地牢 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 88,
        steamAppID: 262060,
        nexusMods: {
            game_domain_name: "darkestdungeon",
            game_id: 804,
        },
        installdir: await join("DarkestDungeon", "_windows", "win64"),
        gameName: "Darkest Dungeon",
        gameExe: [
            {
                name: "Darkest.exe",
                rootPath: ["..", ".."],
            },
        ],
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/262060",
            },
            {
                name: "直接启动",
                exePath: await join("_windows", "win64", "Darkest.exe"),
            },
        ],
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/88.jpg",
        modType: [
            {
                id: 1,
                name: "mods",
                installPath: await join("mods"),
                async install(mod) {
                    void mod;
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "project.xml",
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
                        "project.xml",
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
            let mods = false;
            for (const item of mod.modFiles) {
                if ((await basename(item)) == "project.xml") mods = true;
            }

            if (mods) return 1;

            return 99;
        },
    }) as ISupportedGames;
