import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

export const supportedGames = async () => ({
    GlossGameId: 409,
    steamAppID: 1790600,
    nexusMods: {
        game_domain_name: "dragonballsparkingzero",
        game_id: 6892,
    },
    gameName: "SparkingZERO",
    installdir: "DRAGON BALL Sparking! ZERO",
    gameExe: "SparkingZERO.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1790600",
        },
        {
            name: "直接启动",
            exePath: "SparkingZERO.exe",
        },
    ],
    archivePath: await join(
        await FileHandler.GetAppData(),
        "Local",
        "SparkingZERO",
        "Saved"
    ),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/mod/202412/MOD675a58a521b54.png@webp",
    modType: await UnrealEngine.modType("SparkingZERO", false),
    checkModType: UnrealEngine.checkModType,
}) as ISupportedGames;
