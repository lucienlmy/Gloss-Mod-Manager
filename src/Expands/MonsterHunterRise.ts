import { join } from "@tauri-apps/api/path";
import { REEngine } from "@/lib/REEngine";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 怪物猎人崛起支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 270,
        steamAppID: 1446780,
        nexusMods: {
            game_domain_name: "monsterhunterrise",
            game_id: 4095,
        },
        installdir: "MonsterHunterRise",
        gameName: "MonsterHunterRise",
        gameExe: "MonsterHunterRise.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1446780",
            },
            {
                name: "直接启动",
                exePath: "MonsterHunterRise.exe",
            },
        ],
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/61dbdb30cdbce.png",
        archivePath: await join(
            (await ScanGame.getSteamInstallPath()) || "",
            "userdata",
            await ScanGame.GetLastSteamId32(),
            "1446780",
            "remote",
        ),
        modType: await REEngine.modType(),
        checkModType: REEngine.checkModType,
    }) as ISupportedGames;
