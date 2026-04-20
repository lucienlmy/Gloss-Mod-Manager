import { join } from "@tauri-apps/api/path";
import { REEngine } from "@/lib/REEngine";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 龙之信条2 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 343,
    steamAppID: 2054970,
    nexusMods: {
        game_domain_name: "dragonsdogma2",
        game_id: 6234
    },
    installdir: "Dragons Dogma 2",
    gameName: "Dragons Dogma 2",
    gameExe: 'DD2.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/2054970'
        },
        {
            name: '直接启动',
            exePath: 'DD2.exe'
        }
    ],
    archivePath: await join(await ScanGame.getSteamInstallPath() || "", "userdata", await ScanGame.GetLastSteamId32(), "2054970", "remote"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/65f8f21471754.webp",
    modType: await REEngine.modType(),
    checkModType: REEngine.checkModType
}) as ISupportedGames;
