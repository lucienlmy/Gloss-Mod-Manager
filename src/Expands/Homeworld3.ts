import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 家园3 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 312,
    steamAppID: 1840080,
    nexusMods: {
        game_domain_name: "homeworld3",
        game_id: 6432
    },
    installdir: await join("Homeworld 3"),
    gameName: "Homeworld 3",
    gameExe: "Homeworld3.exe",
    mod_io: 5251,
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1840080"
        },
        {
            name: "直接启动",
            exePath: "Homeworld3.exe"
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "Homeworld3", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/6423ab827ad41.webp",
    modType: await UnrealEngine.modType("Homeworld3", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
