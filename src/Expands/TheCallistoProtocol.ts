import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 木卫四协议 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 345,
    steamAppID: 1544020,
    nexusMods: {
        game_domain_name: "callistoprotocol",
        game_id: 4978
    },
    installdir: await join("The Callisto Protocol"),
    gameName: "The Callisto Protocol",
    gameExe: "TheCallistoProtocol.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1544020"
        },
        {
            name: "直接启动",
            exePath: "TheCallistoProtocol.exe"
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "CallistoProtocol", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/6605404b51bc3.webp",
    modType: await UnrealEngine.modType("TheCallistoProtocol", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
