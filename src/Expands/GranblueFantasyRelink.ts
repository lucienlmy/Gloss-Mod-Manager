import { join } from "@tauri-apps/api/path";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 碧蓝幻想 Relink 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 336,
        steamAppID: 881020,
        installdir: await join("Granblue Fantasy Relink"),
        gameName: "Granblue Fantasy Relink",
        gameExe: "granblue_fantasy_relink.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/881020",
            },
            {
                name: "直接启动",
                exePath: "granblue_fantasy_relink.exe",
            },
        ],
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/65bb62a24e92f.webp",
        modType: await UnrealEngine.modType("Polaris", false),
        checkModType: UnrealEngine.checkModType,
    }) as ISupportedGames;
