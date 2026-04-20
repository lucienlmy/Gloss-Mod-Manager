import { join } from "@tauri-apps/api/path";
import { REEngine } from "@/lib/REEngine";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 生化危机4 重制版 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 303,
    steamAppID: 2050650,
    nexusMods: {
        game_domain_name: "residentevil42023",
        game_id: 5195
    },
    installdir: "RESIDENT EVIL 4  BIOHAZARD RE4",
    gameName: "RE4Remake",
    gameExe: 're4.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/2050650'
        },
        {
            name: '直接启动',
            exePath: 're4.exe'
        }
    ],
    archivePath: await join(await ScanGame.getSteamInstallPath() || "", "userdata", await ScanGame.GetLastSteamId32(), "2050650", "remote"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/63e310bf62591.webp",
    modType: await REEngine.modType(),
    checkModType: REEngine.checkModType,
}) as ISupportedGames;
