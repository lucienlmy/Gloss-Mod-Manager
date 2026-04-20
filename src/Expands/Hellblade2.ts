import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 地狱之刃2 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 355,
    steamAppID: 2461850,
    nexusMods: {
        game_domain_name: "senuassagahellblade2",
        game_id: 6438
    },
    installdir: await join("Senua's Saga Hellblade II"),
    gameName: "Senua's Saga Hellblade 2",
    gameExe: "Hellblade2.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2461850"
        },
        {
            name: "直接启动",
            exePath: "Hellblade2.exe"
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "Hellblade2", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/181.jpg",
    modType: await UnrealEngine.modType("Hellblade2", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
