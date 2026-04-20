import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 寂静岭 F 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 461,
    steamAppID: 2947440,
    nexusMods: {
        game_domain_name: "silenthillf",
        game_id: 8203,
    },
    installdir: await join("Silent Hill f"),
    gameName: "Silent Hill f",
    gameExe: "SHf.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2947440",
        },
        {
            name: "直接启动",
            exePath: await join("SHf.exe"),
        },
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "SHf", "Saved"),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_68d35aebce565.png",
    modType: await UnrealEngine.modType("SHf", false),
    checkModType: UnrealEngine.checkModType,
}) as ISupportedGames;
