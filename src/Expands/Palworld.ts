import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 幻兽帕鲁 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 333,
        steamAppID: 1623730,
        curseforge: 85196,
        nexusMods: {
            game_domain_name: "palworld",
            game_id: 6030,
        },
        installdir: await join("Palworld"),
        gameName: "Palworld",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1623730",
            },
            {
                name: "直接启动",
                exePath: "Palworld.exe",
            },
        ],
        gameExe: [
            {
                name: "Palworld.exe",
                rootPath: ["."],
            },
            {
                name: "PalServer.exe",
                rootPath: ["."],
            },
        ],
        archivePath: await join(
            await FileHandler.GetAppData(),
            "Local",
            "Pal",
            "Saved",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/65ae3cdbc7680.webp",
        modType: await UnrealEngine.modType("Pal"),
        checkModType: UnrealEngine.checkModType,
    }) as ISupportedGames;
