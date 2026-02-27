/**
 * @description 生化危机9 安魂曲 支持
 */

import { join } from "path";
import { REEngine } from "@/model/REEngine";

export const supportedGames: ISupportedGames = {
    GlossGameId: 488,
    steamAppID: 3764200,
    // nexusMods: {
    //     game_domain_name: "residentevil42023",
    //     game_id: 5195
    // },
    installdir: "RESIDENT EVIL requiem BIOHAZARD requiem",
    gameName: "Resident Evil Requiem",
    gameExe: "re9.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/3764200",
        },
        {
            name: "直接启动",
            exePath: "re9.exe",
        },
    ],
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_69a0f03164da1.png",
    modType: REEngine.modType,
    checkModType: REEngine.checkModType,
};
