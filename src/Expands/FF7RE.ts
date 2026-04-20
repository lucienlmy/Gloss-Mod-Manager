import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 最终幻想 7 重制版 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 266,
    steamAppID: 1462040,
    nexusMods: {
        game_domain_name: "finalfantasy7remake",
        game_id: 4202
    },
    // curseforge: 4593,
    installdir: await join("FINAL FANTASY VII REMAKE"),
    gameName: "FINAL FANTASY VII REMAKE",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1462040"
        },
        {
            name: "直接启动",
            exePath: "ff7remake.exe"
        }
    ],
    gameExe: "ff7remake.exe",
    archivePath: await join(await FileHandler.getMyDocuments(), "My Games", "FINAL FANTASY VII REMAKE"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/61c027ed1cbc1.png",
    modType: await UnrealEngine.modType("End", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
