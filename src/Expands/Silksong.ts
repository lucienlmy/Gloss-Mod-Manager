import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 空洞骑士：丝之歌 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 451,
    steamAppID: 1030300,
    nexusMods: {
        game_domain_name: "hollowknightsilksong",
        game_id: 8136,
    },
    installdir: await join("Hollow Knight Silksong"),
    gameName: "Hollow Knight Silksong",
    gameExe: "Hollow Knight Silksong.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1030300",
        },
        {
            name: "直接启动",
            exePath: await join("Hollow Knight Silksong.exe"),
        },
    ],
    archivePath: await join(
        await FileHandler.GetAppData(),
        "LocalLow",
        "Team Cherry",
        "Hollow Knight Silksong"
    ),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_68baa8da077d0.jpg",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType,
}) as ISupportedGames;
