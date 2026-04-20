import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 山门与幻境 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 347,
    steamAppID: 1963040,
    nexusMods: {
        game_domain_name: "thelostvillage",
        game_id: 6362
    },
    installdir: await join("TheLostVillage"),
    gameName: "The Lost Village",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1963040"
        },
        {
            name: "直接启动",
            exePath: "TheLostVillage.exe"
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "TheLostVillage", "Saved"),
    gameExe: "TheLostVillage.exe",
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/6629bb7235d50.webp",
    modType: await UnrealEngine.modType("TheLostVillage", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
