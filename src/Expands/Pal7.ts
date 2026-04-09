/**
 * @description 仙剑奇侠传7 支持
 */

import { UnrealEngine } from "@/lib/UnrealEngine";
import { join } from "@tauri-apps/api/path";

export const supportedGames = async () =>
    ({
        GlossGameId: 277,
        steamAppID: 1543030,
        nexusMods: {
            game_domain_name: "swordandfairy7",
            game_id: 4194,
        },
        installdir: await join("仙剑奇侠传七"),
        gameName: "Pal7",
        gameExe: "Pal7.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1543030",
            },
            {
                name: "直接启动",
                exePath: "Pal7.exe",
            },
        ],
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/6256729d72a41.png",
        modType: await UnrealEngine.modType("Pal7", false),
        checkModType: UnrealEngine.checkModType,
    }) as ISupportedGames;
