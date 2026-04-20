import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description Flintlock 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 368,
    steamAppID: 1832040,
    nexusMods: {
        game_domain_name: "flintlockthesiegeofdawn",
        game_id: 6505
    },
    installdir: await join("Flintlock The Siege of Dawn"),
    gameName: "Flintlock The Siege of Dawn",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1832040"
        },
        {
            name: "直接启动",
            exePath: "Saltpeter.exe"
        }
    ],
    gameExe: "Saltpeter.exe",
    archivePath: await join(await FileHandler.GetAppData(), "Local", "Saltpeter", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/mod/202407/MOD669a223b01b15.webp@webp",
    modType: await UnrealEngine.modType("Saltpeter", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
