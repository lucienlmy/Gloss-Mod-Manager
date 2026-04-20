import { join } from "@tauri-apps/api/path";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 异形工厂2 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 378,
    steamAppID: 2162800,
    Thunderstore: {
        community_identifier: "dyson-sphere-program",
    },
    installdir: await join("shapez 2"),
    gameName: "Shapez 2",
    gameExe: "shapez 2.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2162800",
        },
        {
            name: "直接启动",
            exePath: await join("shapez 2.exe"),
        },
    ],
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/mod/202408/MOD66bf055eb2ba5.webp@webp",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType,
}) as ISupportedGames;
