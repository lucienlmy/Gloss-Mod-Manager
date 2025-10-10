/**
 * @description 空洞骑士：丝之歌 支持
 */

import { join } from "node:path";

export const supportedGames: ISupportedGames = {
    GlossGameId: 451,
    steamAppID: 1030300,
    nexusMods: {
        game_domain_name: "hollowknightsilksong",
        game_id: 8136,
    },
    installdir: join("Hollow Knight Silksong"),
    gameName: "Hollow Knight Silksong",
    gameExe: "Hollow Knight Silksong.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1030300",
        },
        {
            name: "直接启动",
            exePath: join("Hollow Knight Silksong.exe"),
        },
    ],
    archivePath: join(
        FileHandler.GetAppData(),
        "LocalLow",
        "Team Cherry",
        "Hollow Knight Silksong"
    ),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_68baa8da077d0.jpg",
    modType: UnityGame.modType,
    checkModType: UnityGame.checkModType,
};
