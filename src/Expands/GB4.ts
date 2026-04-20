import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 高达创坏者 4 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 388,
    steamAppID: 1672500,
    nexusMods: {
        game_domain_name: "gundambreaker4",
        game_id: 6772
    },
    installdir: await join("GBBBB"),
    gameName: "GUNDAM BREAKER 4",
    gameExe: "GB4.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1672500"
        },
        {
            name: "直接启动",
            exePath: await join("GB4.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "GB4", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/mod/202410/MOD670635775ec6c.webp@webp",
    modType: await UnrealEngine.modType("GB4", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
