import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 森林之子 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 305,
    steamAppID: 1326470,
    Thunderstore: {
        community_identifier: 'sons-of-the-forest'
    },
    nexusMods: {
        game_domain_name: "sonsoftheforest",
        game_id: 5165
    },
    installdir: await join("Sons Of The Forest"),
    gameName: "Sons Of The Forest",
    gameExe: "SonsOfTheForest.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1326470"
        },
        {
            name: "直接启动",
            exePath: await join("SonsOfTheForest.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "LocalLow", "Endnight", "SonsOfTheForest"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/63fc08e3ef48b.webp",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
