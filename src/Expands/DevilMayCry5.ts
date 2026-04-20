import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { REEngine } from "@/lib/REEngine";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 鬼泣5 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 183,
    steamAppID: 601150,
    nexusMods: {
        game_id: 2751,
        game_domain_name: "devilmaycry5",
    },
    installdir: "Devil May Cry 5",
    gameName: "Devil May Cry 5",
    gameExe: 'DevilMayCry5.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/601150'
        },
        {
            name: '直接启动',
            exePath: 'DevilMayCry5.exe'
        }
    ],
    archivePath: await (async () => {
        let steamPath = await ScanGame.getSteamInstallPath()
        if (steamPath) {
            return await join(steamPath, 'userdata', await ScanGame.GetLastSteamId32(), '601150', 'remote')
        } else {
            return await join(await FileHandler.GetAppData(), "Local", "SKIDROW", "220440", "Storage")
        }
    })(),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/183.jpg",
    modType: await REEngine.modType(),
    checkModType: REEngine.checkModType
}) as ISupportedGames;
