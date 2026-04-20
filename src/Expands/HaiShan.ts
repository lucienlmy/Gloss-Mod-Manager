import { join } from "@tauri-apps/api/path";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 海山 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 366,
    steamAppID: 2180340,
    Thunderstore: {
        community_identifier: 'dyson-sphere-program'
    },
    installdir: await join("HaiShan", "HaiShan"),
    gameName: "HaiShan",
    gameExe: "海山.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2180340"
        },
        {
            name: "直接启动",
            exePath: await join("海山.exe")
        }
    ],
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/mod/202407/MOD669638c34fae8.webp@webp",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
