import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGameILCPP2 } from "@/lib/UnityGame";

/**
 * @description 漫漫长夜 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 65,
        steamAppID: 305620,
        nexusMods: {
            game_domain_name: "thelongdark",
            game_id: 1779,
        },
        installdir: await join("TheLongDark"),
        gameName: "The Long Dark",
        gameExe: "tld.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/305620",
            },
            {
                name: "直接启动",
                exePath: "tld.exe",
            },
        ],
        archivePath: await join(
            await FileHandler.GetAppData(),
            "Local",
            "Hinterland",
            "TheLongDark",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/65.png",
        modType: UnityGameILCPP2.modType,
        checkModType: UnityGameILCPP2.checkModType,
    }) as ISupportedGames;
