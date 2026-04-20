import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description 腐烂国度2 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 238,
    steamAppID: 495420,
    nexusMods: {
        game_domain_name: "stateofdecay2",
        game_id: 2433
    },
    installdir: await join("StateOfDecay2"),
    gameName: "State of Decay 2",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/495420"
        },
        {
            name: "直接启动",
            exePath: "StateOfDecay2.exe"
        }
    ],
    gameExe: "StateOfDecay2.exe",
    archivePath: await join(await FileHandler.GetAppData(), "Local", "StateOfDecay2", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/238.png",
    modType: await UnrealEngine.modType("StateOfDecay2", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
