import { join } from "@tauri-apps/api/path";
import { REEngine } from "@/lib/REEngine";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 生化危机3 重制版 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 224,
    steamAppID: 952060,
    nexusMods: {
        game_domain_name: "residentevil32020",
        game_id: 3191
    },
    installdir: "RE3",
    gameName: "Resident Evil 3",
    gameExe: 're3.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/952060'
        },
        {
            name: '直接启动',
            exePath: 're3.exe'
        }
    ],
    archivePath: await join(await ScanGame.getSteamInstallPath() || "", "userdata", await ScanGame.GetLastSteamId32(), "952060", "remote"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/224.png",
    modType: await REEngine.modType(),
    checkModType: REEngine.checkModType,
}) as ISupportedGames;
