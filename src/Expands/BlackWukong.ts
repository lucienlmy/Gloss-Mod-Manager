import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 黑神话：悟空 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 376,
        steamAppID: 2358720,
        nexusMods: {
            game_domain_name: "blackmythwukong",
            game_id: 6713,
        },
        installdir: await join("BlackMythWukong"),
        gameName: "Black Myth Wukong",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/2358720",
            },
            {
                name: "直接启动",
                exePath: "b1.exe",
            },
        ],
        gameExe: "b1.exe",
        archivePath: await join(
            await FileHandler.GetAppData(),
            "Local",
            "b1",
            "Saved",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/mod/202408/MOD66b5c72696594.webp@webp",
        modType: await UnrealEngine.modType("b1", false),
        async checkModType(mod) {
            for (const item of mod.modFiles) {
                if (FileHandler.pathToArray(item).includes("b1")) {
                    return 6;
                }
            }

            return UnrealEngine.checkModType(mod);
        },
    }) as ISupportedGames;
