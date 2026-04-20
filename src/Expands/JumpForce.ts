import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description Jump大乱斗 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 181,
    steamAppID: 816020,
    nexusMods: {
        game_domain_name: "jumpforce",
        game_id: 2765
    },
    installdir: await join("JUMP FORCE"),
    gameName: "JUMP FORCE",
    gameExe: "JUMP_FORCE.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/816020"
        },
        {
            name: "直接启动",
            exePath: "JUMP_FORCE.exe"
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "local", "JUMP_FORCE", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/181.jpg",
    modType: await UnrealEngine.modType("JUMP_FORCE", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
