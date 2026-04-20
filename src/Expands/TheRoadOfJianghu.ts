import { join } from "@tauri-apps/api/path";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 刀剑江湖路 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 383,
    steamAppID: 2361680,
    nexusMods: {
        game_domain_name: "pathofkungfu",
        game_id: 6910
    },
    installdir: await join("The road of Jianghu"),
    gameName: "The road of Jianghu",
    gameExe: "daojianjianghulu.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2361680"
        },
        {
            name: "直接启动",
            exePath: await join("daojianjianghulu.exe")
        }
    ],
    // archivePath: join(await FileHandler.GetAppData(), "LocalLow", "BadMudStudio", "daojianjianghulu"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/mod/202409/MOD66ee9421978bf.jpg@webp",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
