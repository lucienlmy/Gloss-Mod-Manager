import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 原子之心 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 304,
    steamAppID: 668580,
    nexusMods: {
        game_domain_name: 'atomicheart',
        game_id: 5158
    },
    installdir: await join("Atomic Heart"),
    gameName: "Atomic Heart",
    gameExe: "AtomicHeart.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/668580"
        },
        {
            name: "直接启动",
            exePath: "AtomicHeart.exe"
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "..", "Saved Games", "AtomicHeart"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/63f5846644d4e.webp",
    modType: await UnrealEngine.modType("AtomicHeart", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
