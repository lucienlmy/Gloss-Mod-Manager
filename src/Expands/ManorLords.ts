import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 庄园领主 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 348,
    steamAppID: 1363080,
    nexusMods: {
        game_domain_name: "manorlords",
        game_id: 6352
    },
    installdir: await join("Manor Lords"),
    gameName: "Manor Lords",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1363080"
        },
        {
            name: "直接启动",
            exePath: "ManorLords.exe"
        }
    ],
    gameExe: "ManorLords.exe",
    archivePath: await join(await FileHandler.GetAppData(), "Local", "ManorLords", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/662db2a8b4521.webp",
    modType: await UnrealEngine.modType("ManorLords", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
