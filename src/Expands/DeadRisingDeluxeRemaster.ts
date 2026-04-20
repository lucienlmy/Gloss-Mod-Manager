import { join } from "@tauri-apps/api/path";
import { REEngine } from "@/lib/REEngine";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 丧尸围城豪华复刻版 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 391,
    steamAppID: 2527390,
    nexusMods: {
        game_domain_name: "deadrisingdeluxeremaster",
        game_id: 6837
    },
    installdir: "DEAD RISING DELUXE REMASTER",
    gameName: "Dead Rising Deluxe Remaster",
    gameExe: 'DRDR.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/2527390'
        },
        {
            name: '直接启动',
            exePath: 'DRDR.exe'
        }
    ],
    archivePath: await join(await ScanGame.getSteamInstallPath() || "", "userdata", await ScanGame.GetLastSteamId32(), "2527390", "remote"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/mod/202410/MOD67077f9f042f5.webp@webp",
    modType: await REEngine.modType(),
    checkModType: REEngine.checkModType
}) as ISupportedGames;
