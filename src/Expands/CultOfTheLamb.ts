import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 咩咩启示录 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 342,
    steamAppID: 1313140,
    Thunderstore: {
        community_identifier: 'cult-of-the-lamb'
    },
    nexusMods: {
        game_domain_name: "cultofthelamb",
        game_id: 4736
    },
    installdir: await join("Cult Of The Lamb"),
    gameName: "Cult Of The Lamb",
    gameExe: "Cult Of The Lamb.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1313140"
        },
        {
            name: "直接启动",
            exePath: await join("Cult Of The Lamb.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "Massive Monster", "Cult Of The Lamb"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/65f2c99bb3e08.webp",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
