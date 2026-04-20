import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 逸剑风云决 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 328,
    steamAppID: 1876890,
    nexusMods: {
        game_domain_name: "wanderingsword",
        game_id: 5732
    },
    installdir: await join("Wandering Sword"),
    gameName: "Wandering Sword",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1876890"
        },
        {
            name: "直接启动",
            exePath: "JH.exe"
        }
    ],
    gameExe: "JH.exe",
    archivePath: await join(await FileHandler.GetAppData(), "Local", "Wandering_Sword", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/656d920e5f559.webp",
    modType: await UnrealEngine.modType("Wandering_Sword", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
