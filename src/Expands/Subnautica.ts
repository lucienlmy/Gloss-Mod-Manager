import { join } from "@tauri-apps/api/path";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 深海迷航 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 105,
    steamAppID: 264710,
    nexusMods: {
        game_id: 1155,
        game_domain_name: "subnautica",
    },
    installdir: await join("Subnautica"),
    gameName: "Subnautica",
    gameExe: "Subnautica.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/264710"
        },
        {
            name: "直接启动",
            exePath: await join("Subnautica.exe")
        }
    ],
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/105a.jpg",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
