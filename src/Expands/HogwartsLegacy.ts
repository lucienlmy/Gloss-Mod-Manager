/** 
 * @description 霍格沃茨之遗 支持
*/
import { ISupportedGames } from "@src/model/Interfaces";

let supportedGames: ISupportedGames = {
    gameName: "霍格沃茨之遗",
    gameEnName: "Hogwarts Legacy",
    gameExe: 'HogwartsLegacy.exe',
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/63e2f9656f092.webp",
    modType: [
        {
            id: 1,
            name: 'pak 包',
            installPath: '\\Phoenix\\Content\\Paks',
            install: (mod) => {

            },
            uninstall: (mod) => {

            }
        },
        {
            id: 2,
            name: '插件',
            installPath: '\\',
            install(mod) {

            },
            uninstall(mod) {

            },
        }
    ]
}

export default supportedGames