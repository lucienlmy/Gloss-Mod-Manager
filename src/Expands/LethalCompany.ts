import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 致命公司 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 329,
    steamAppID: 1966720,
    Thunderstore: {
        community_identifier: 'lethal-company'
    },
    nexusMods: {
        game_domain_name: "lethalcompany",
        game_id: 5848
    },
    installdir: await join("Lethal Company"),
    gameName: "Lethal Company",
    gameExe: "Lethal Company.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1966720"
        },
        {
            name: "直接启动",
            exePath: await join("Lethal Company.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "ZeekerssRBLX"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/65a0f0fb13a40.webp",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
