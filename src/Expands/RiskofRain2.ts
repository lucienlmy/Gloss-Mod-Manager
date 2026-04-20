import { join } from "@tauri-apps/api/path";
import { UnityGame } from "@/lib/UnityGame";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 雨中冒险2 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 250,
    steamAppID: 632360,
    Thunderstore: {
        community_identifier: 'riskofrain2'
    },
    installdir: await join("Risk of Rain 2"),
    gameName: "Risk of Rain 2",
    gameExe: "Risk of Rain 2.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/632360"
        },
        {
            name: "直接启动",
            exePath: await join("Risk of Rain 2.exe")
        }
    ],
    archivePath: await join(await ScanGame.getSteamInstallPath() || "", "userdata", await ScanGame.GetLastSteamId32(), "632360", "remote", "UserProfiles"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/607926e04c16a.png",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
