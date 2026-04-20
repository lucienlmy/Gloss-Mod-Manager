import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 戴森球计划 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 245,
    steamAppID: 1366540,
    nexusMods: {
        game_domain_name: "dysonsphereprogram",
        game_id: 3641
    },
    Thunderstore: {
        community_identifier: 'dyson-sphere-program'
    },
    installdir: await join("Dyson Sphere Program"),
    gameName: "Dyson Sphere Program",
    gameExe: "DSPGAME.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1366540"
        },
        {
            name: "直接启动",
            exePath: await join("DSPGAME.exe")
        }
    ],
    archivePath: await join(await FileHandler.getMyDocuments(), "Dyson Sphere Program"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/60112fb1bdafa.png",
    modType: await UnityGame.modType(),
    checkModType: UnityGame.checkModType
}) as ISupportedGames;
