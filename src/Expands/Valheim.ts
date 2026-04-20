import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 英灵神殿 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 340,
    steamAppID: 892970,
    Thunderstore: {
        community_identifier: 'valheim'
    },
    nexusMods: {
        game_domain_name: "valheim",
        game_id: 3667
    },
    installdir: await join("Valheim"),
    gameName: "Valheim",
    gameExe: "valheim.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/892970"
        },
        {
            name: "直接启动",
            exePath: await join("valheim.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "IronGate", "Valheim"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/65f1415124b36.webp",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
