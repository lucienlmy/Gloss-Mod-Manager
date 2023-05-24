import { FileHandler } from "@src/model/FileHandler";
import { IModInfo, IState, ISupportedGames } from "@src/model/Interfaces";
import { useManager } from "@src/stores/useManager";
import { join, extname, sep, basename, dirname } from 'path'
import { statSync } from "fs";
import { Manager } from "@src/model/Manager";
import { ElMessage } from "element-plus";

export const supportedGames: ISupportedGames = {
    gameID: 248,
    gameName: "Tale of Immortal",
    gameExe: 'guigubahuang.exe',
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/603e05b7aef61.png",
    modType: [],
    checkModType(mod) {
        return 1
    }
}