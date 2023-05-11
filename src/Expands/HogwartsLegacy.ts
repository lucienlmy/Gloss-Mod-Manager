/** 
 * @description 霍格沃茨之遗 安装
*/
import { IModInfo, ISupportedGames } from "@src/model/Interfaces";
import { useSettings } from "@src/stores/useSettings";
import { basename } from 'node:path'
import { FileHandler } from "@src/model/FileHandler";
import { Manager } from "@src/model/Manager"

let supportedGames: ISupportedGames = {
    gameID: 302,
    gameName: "霍格沃茨之遗",
    gameEnName: "Hogwarts Legacy",
    gameExe: 'HogwartsLegacy.exe',
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/63e2f9656f092.webp",
    modType: [
        {
            id: 1,
            name: '基础类型',
            installPath: 'Phoenix\\Content\\Paks\\~mods',
            async install(mod) {
                try {
                    let res = Manager.generalInstall(mod, this.installPath ?? "")
                    return res
                } catch (e) {
                    console.log(e);
                    FileHandler.writeLog(`错误:${e}`);
                    return false
                }
            },
            async uninstall(mod) {
                try {
                    return Manager.generalUninstall(mod, this.installPath ?? "")
                } catch (e) {
                    console.log(e);
                    FileHandler.writeLog(`错误:${e}`);
                    return false
                }
            }
        }
    ],
    checkModType(mod: IModInfo) {
        return 1
    }
}


export default supportedGames