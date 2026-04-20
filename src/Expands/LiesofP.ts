import { join } from "@tauri-apps/api/path";
import { UnrealEngine } from "@/lib/UnrealEngine";

export const supportedGames = async () => ({
    GlossGameId: 325,
    steamAppID: 1627720,
    nexusMods: {
        game_domain_name: "liesofp",
        game_id: 5441
    },
    installdir: await join("Lies of P"),
    gameName: "Lies of P",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1627720"
        },
        {
            name: "直接启动",
            exePath: "LOP.exe"
        }
    ],
    gameExe: "LOP.exe",
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/65127b4a5041a.webp",
    modType: await UnrealEngine.modType("LiesofP", false),
    checkModType: UnrealEngine.checkModType,
}) as ISupportedGames;
