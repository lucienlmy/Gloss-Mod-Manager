import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 缉私警察 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 339,
    steamAppID: 756800,
    nexusMods: {
        game_domain_name: "contrabandpolice",
        game_id: 5226
    },
    installdir: await join("Contraband Police"),
    gameName: "Contraband Police",
    gameExe: "ContrabandPolice.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/756800"
        },
        {
            name: "直接启动",
            exePath: await join("ContrabandPolice.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "CrazyRocks", "ContrabandPolice"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/65f1169237040.webp",
    modType: [
        ...(await UnityGame.modType())
    ],
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
