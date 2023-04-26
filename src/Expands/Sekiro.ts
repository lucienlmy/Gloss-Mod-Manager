/**
 * @description 只狼 支持
 */

import { ISupportedGames } from "@src/model/Interfaces";

let supportedGames: ISupportedGames = {
    gameName: "只狼",
    gameExe: 'sekiro.exe',
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/185.png",
    modType: [
        {
            id: 1,
            name: 'pak 包',
            installPath: '\\mods',
            install: (mod) => {
                console.log(this);
            },
            uninstall: (mod) => {

            }
        }
    ]
}

export default supportedGames