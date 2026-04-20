import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 堕落之主 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 352,
    steamAppID: 1501750,
    nexusMods: {
        game_domain_name: "lordsofthefallen2023",
        game_id: 5803
    },
    installdir: await join("Lords of the Fallen"),
    gameName: "Lords of the Fallen",
    gameExe: "LOTF2.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1501750"
        },
        {
            name: "直接启动",
            exePath: "LOTF2.exe"
        }
    ],
    archivePath: await (async () => {
        return await join(await FileHandler.GetAppData(), "Local", "LOTF2", "Saved")
    })(),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/664db7b3148f8.webp",
    modType: await UnrealEngine.modType("LOTF2", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
