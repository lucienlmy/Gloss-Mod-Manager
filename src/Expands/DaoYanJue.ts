import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 道衍诀 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 350,
    steamAppID: 1951220,
    installdir: await join("DaoYanJue"),
    gameName: "DaoYanJue",
    gameExe: "FNGameX.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1951220"
        },
        {
            name: "直接启动",
            exePath: "FNGameX.exe"
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "FNGameX", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/66447d161b2ff.webp",
    modType: await UnrealEngine.modType("FNGameX", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
