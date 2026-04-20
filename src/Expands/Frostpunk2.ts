import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 冰汽时代 2 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 387,
    steamAppID: 1601580,
    nexusMods: {
        game_domain_name: "frostpunk2",
        game_id: 6349
    },
    installdir: await join("Frostpunk2"),
    gameName: "Frostpunk 2",
    gameExe: "Frostpunk2.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1601580"
        },
        {
            name: "直接启动",
            exePath: await join("Frostpunk2.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "11bitstudios", "Frostpunk2"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/mod/202410/MOD6706347b70717.webp@webp",
    modType: await UnrealEngine.modType("Frostpunk2", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
