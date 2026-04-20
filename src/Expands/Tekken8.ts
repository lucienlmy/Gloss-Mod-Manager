import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 铁拳8 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 335,
    steamAppID: 1778820,
    nexusMods: {
        game_domain_name: "tekken8",
        game_id: 5622
    },
    installdir: await join("TEKKEN 8"),
    gameName: "Tekken 8",
    gameExe: "TEKKEN 8.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1778820"
        },
        {
            name: "直接启动",
            exePath: "TEKKEN 8.exe"
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "TEKKEN 8", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/65b9e69f3b61b.webp",
    modType: await UnrealEngine.modType("Polaris", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
