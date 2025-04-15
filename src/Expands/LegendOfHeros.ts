/**
 * @description 英雄立志传：三国志
 */

import { join, basename } from 'path'
import { statSync } from "fs";
import { Manager } from '@/model/Manager';

let dictionaryList: string[] = []

async function handleMod(mod: IModInfo, installPath: string, isInstall: boolean) {
    try {

        if (dictionaryList.length == 0) {
            let EldenRingDictionary = FileHandler.readFile(join(await FileHandler.getResourcesPath(), 'res', 'ThreeKingdomDictionary.txt'))
            dictionaryList = EldenRingDictionary.split("\r\n")
        }

        const manager = useManager()
        let res: IState[] = []
        mod.modFiles.forEach(async file => {
            try {
                let modStorage = join(manager.modStorage ?? "", mod.id.toString(), file)
                // 判断是否是文件
                if (!statSync(modStorage).isFile()) return

                let name = basename(file)
                // 判断name 是否在list中
                if (dictionaryList.some(item => item.includes(name))) {
                    // 获取对应的目录
                    let path = dictionaryList.find(item => item.includes(name))
                    let gameStorage = join(manager.gameStorage ?? "", installPath, path ?? "")
                    if (isInstall) {
                        let state = await FileHandler.copyFile(modStorage, gameStorage)
                        res.push({ file: file, state: state })
                    } else {
                        let state = FileHandler.deleteFile(gameStorage)
                        res.push({ file: file, state: state })
                    }
                }
            } catch (error) {
                res.push({ file: file, state: false })
            }
        })
        return res
    } catch (error) {
        ElMessage.error(`错误:${error}`)
        return false
    }
}

export const supportedGames: ISupportedGames = {
    GlossGameId: 427,
    steamAppID: 3020510,
    // nexusMods: {
    //     game_domain_name: "thelongdark",
    //     game_id: 1779
    // },
    installdir: join("LegendOfHeros"),
    gameName: "Legend of Heroes Three Kingdoms",
    gameExe: "ThreeKingdom.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/3020510"
        },
        {
            name: "直接启动",
            exePath: "ThreeKingdom.exe"
        }
    ],
    archivePath: join(FileHandler.GetAppData(), "LocalLow", "FreeWing", "ThreeKingdom"),
    gameCoverImg: "https://mod.3dmgame.com/static/upload/logo/croppedImg_67eca42846bf0.jpg",
    modType: [
        ...UnityGameILCPP2.modType,
        {
            id: 4,
            name: "Data",
            installPath: join(""),
            async install(mod) {
                return handleMod(mod, this.installPath ?? "", true)
            },
            async uninstall(mod) {
                return handleMod(mod, this.installPath ?? "", false)
            }
        },
        {
            id: 5,
            name: "Portraits",
            installPath: join("ThreeKingdom_Data", "StreamingAssets", "Portraits"),
            async install(mod) {
                return Manager.installByFileSibling(mod, this.installPath ?? "", "260x340", true)
            },
            async uninstall(mod) {
                return Manager.installByFileSibling(mod, this.installPath ?? "", "260x340", false)

            }
        }
    ],
    async checkModType(mod) {

        let folderList = ['260x340', '1000x1400', '1024x1024']


        let StreamingAssets = false
        let Portraits = false
        if (dictionaryList.length == 0) {
            let EldenRingDictionary = FileHandler.readFile(join(await FileHandler.getResourcesPath(), 'res', 'ThreeKingdomDictionary.txt'))
            dictionaryList = EldenRingDictionary.split("\r\n")
        }

        mod.modFiles.forEach(item => {
            if (folderList.some(item => item)) Portraits = true
            if (dictionaryList.find(item2 => FileHandler.compareFileName(item, item2))) StreamingAssets = true
        })

        if (StreamingAssets) return 4
        if (Portraits) return 5


        return UnityGameILCPP2.checkModType(mod)
    }
}