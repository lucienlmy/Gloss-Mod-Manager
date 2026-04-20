import { join } from "@tauri-apps/api/path";
import { REEngine } from "@/lib/REEngine";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 生化危机2 重制版 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 180,
    steamAppID: 883710,
    nexusMods: {
        game_domain_name: "residentevil22019",
        game_id: 2702
    },
    installdir: "RESIDENT EVIL 2  BIOHAZARD RE2",
    gameName: "Resident Evil 2",
    gameExe: 're2.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/883710'
        },
        {
            name: '直接启动',
            exePath: 're2.exe'
        }
    ],
    archivePath: await join(await ScanGame.getSteamInstallPath() || "", "userdata", await ScanGame.GetLastSteamId32(), "883710", "remote"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/180.png",
    modType: await REEngine.modType(),
    checkModType: REEngine.checkModType,
}) as ISupportedGames;
