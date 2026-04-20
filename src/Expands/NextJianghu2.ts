import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 下一站江湖2 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 346,
    steamAppID: 1606180,
    installdir: await join("下一站江湖Ⅱ", "下一站江湖Ⅱ"),
    gameName: "Next Jianghu 2",
    gameExe: "下一站江湖Ⅱ.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1606180"
        },
        {
            name: "直接启动",
            exePath: await join("下一站江湖Ⅱ.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "inmotiongame", "下一站江湖Ⅱ"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/6629b6eff3688.webp",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
