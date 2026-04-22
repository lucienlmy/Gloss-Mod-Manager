import { join } from "@tauri-apps/api/path";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 光与影：33号远征队 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 432,
        steamAppID: 1903340,
        nexusMods: {
            game_domain_name: "clairobscurexpedition33",
            game_id: 7635,
        },
        // curseforge: 4593,
        installdir: await join("Expedition 33"),
        gameName: "Clair Obscur Expedition 33",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1903340",
            },
            {
                name: "直接启动",
                exePath: "Expedition33_Steam.exe",
            },
        ],
        gameExe: [
            {
                name: "Expedition33_Steam.exe",
                rootPath: ["."],
            },
            {
                name: "SandFall-Win64-Shipping.exe",
                rootPath: ["..", "..", ".."],
            },
        ],
        // archivePath: join(await FileHandler.getMyDocuments(), "My Games", "FINAL FANTASY VII REMAKE"),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_6809e94cd72e9.jpg",
        modType: await UnrealEngine.modType("Sandfall", false),
        checkModType: UnrealEngine.checkModType,
    }) as ISupportedGames;
