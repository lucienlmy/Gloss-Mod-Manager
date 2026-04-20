import { join } from "@tauri-apps/api/path";
import { REEngine } from "@/lib/REEngine";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 怪物猎人 荒野 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 420,
    steamAppID: 2246340,
    nexusMods: {
        game_domain_name: "monsterhunterwilds",
        game_id: 6993
    },
    installdir: "MonsterHunterWilds",
    gameName: "Monster Hunter Wilds",
    gameExe: 'MonsterHunterWilds.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/2246340'
        },
        {
            name: '直接启动',
            exePath: 'MonsterHunterWilds'
        }
    ],
    archivePath: await join(await ScanGame.getSteamInstallPath() || "", "userdata", await ScanGame.GetLastSteamId32(), "2246340", "remote"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/mod/202502/MOD67beca9449633.webp@webp",
    modType: await REEngine.modType(),
    checkModType: REEngine.checkModType,
}) as ISupportedGames;
