import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 夜族崛起 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 285,
    steamAppID: 1604030,
    Thunderstore: {
        community_identifier: 'v-rising'
    },
    nexusMods: {
        game_domain_name: "vrising",
        game_id: 4527
    },
    installdir: await join("VRising"),
    gameName: "VRising",
    gameExe: "VRising.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1604030"
        },
        {
            name: "直接启动",
            exePath: await join("VRising.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "Stunlock Studios", "VRising"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/632f15e51ee2c.png",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
