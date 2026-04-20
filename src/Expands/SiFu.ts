import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 师父 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 64,
    steamAppID: 2138710,
    nexusMods: {
        game_domain_name: "sifu",
        game_id: 4309,
    },
    installdir: await join("Sifu"),
    gameName: "SiFu",
    gameExe: "Sifu.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2138710",
        },
        {
            name: "直接启动",
            exePath: await join("Sifu.exe"),
        },
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "Sifu", "Saved"),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/game/62207195e18a2.png",
    modType: await UnrealEngine.modType("Sifu", false),
    checkModType: UnrealEngine.checkModType,
}) as ISupportedGames;
