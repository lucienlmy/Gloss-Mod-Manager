import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description GTASADE 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 258,
        steamAppID: 1547000,
        nexusMods: {
            game_domain_name: "grandtheftautothetrilogy",
            game_id: 4142,
        },
        installdir: await join(
            "GTA San Andreas - Definitive Edition",
            "Gameface",
            "Binaries",
            "Win64",
        ),
        gameName: "GTA San Andreas Definitive Edition",
        gameExe: [
            {
                name: "SanAndreas.exe",
                rootPath: ["..", "..", ".."],
            },
        ],
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1547000",
            },
            {
                name: "直接启动",
                exePath: await join(
                    "Gameface",
                    "Binaries",
                    "Win64",
                    "SanAndreas.exe",
                ),
            },
        ],
        archivePath: await join(
            await FileHandler.getMyDocuments(),
            "Rockstar Games",
            "GTA San Andreas Definitive Edition",
        ),
        gameCoverImg: "imgs/gtasade_logo.jpg",
        modType: await UnrealEngine.modType("Gameface", false),
        checkModType: UnrealEngine.checkModType,
    }) as ISupportedGames;
