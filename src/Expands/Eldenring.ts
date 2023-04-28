/** 
 * @description 艾尔登法环 支持
*/
import { ISupportedGames } from "@src/model/Interfaces";

let supportedGames: ISupportedGames = {
    gameName: "艾尔登法环",
    gameEnName: "ELDEN RING",
    gameExe: 'eldenring.exe',
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/620b6924d8c0d.png",
    modType: [
        {
            id: 1,
            name: '基础类型',
            installPath: '\\mods',
            install: (mod) => {

            },
            uninstall: (mod) => {

            }
        },
    ]
}

export default supportedGames