import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 古龙风云录 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 337,
        steamAppID: 2340650,
        installdir: await join("古龙风云录"),
        gameName: "GuLong",
        gameExe: "GuLong.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/2340650",
            },
            {
                name: "直接启动",
                exePath: "GuLong.exe",
            },
        ],
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/65bef978b5da4.webp",
        modType: [
            {
                id: 4,
                name: "Mods",
                installPath: await join("Mods"),
                async install(mod) {
                    return Manager.installByFolder(
                        mod,
                        this.installPath ?? "",
                        "Mods",
                        true,
                        false,
                        true,
                    );
                },
                async uninstall(mod) {
                    return Manager.installByFolder(
                        mod,
                        this.installPath ?? "",
                        "Mods",
                        false,
                        false,
                        true,
                    );
                },
            },
            ...(await UnityGame.modType()),
        ],
        async checkModType(mod) {
            for (const item of mod.modFiles) {
                if (FileHandler.pathToArray(item).includes("Mods")) {
                    return 4;
                }
            }

            return UnityGame.checkModType(mod);
        },
    }) as ISupportedGames;
