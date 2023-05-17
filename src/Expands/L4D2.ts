import { IState, ISupportedGames } from "@src/model/Interfaces";
import { useSettings } from "@src/stores/useSettings";
import { extname, basename } from 'path'
import { FileHandler } from "@src/model/FileHandler"

// console.log(settings.settings.managerGame);


export const supportedGames: ISupportedGames = {
    gameID: 12,
    gameName: "Left 4 Dead 2",
    gameExe: 'left4dead2.exe',
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/12.jpg",
    modType: [
        {
            id: 1,
            name: '通用类型',
            installPath: '\\left4dead2\\addons',
            async install(mod) {
                const settings = useSettings()
                let modStorage = `${settings.settings.modStorageLocation}\\${settings.settings.managerGame.gameName}\\${mod.id}`
                let gameStorage = `${settings.settings.managerGame.gamePath}\\${this.installPath}`

                let res: IState[] = []

                mod.modFiles.forEach(async file => {
                    let fileExt = extname(file)
                    if (fileExt === '.vpk') {
                        let source = `${modStorage}\\${file}`
                        let target = `${gameStorage}\\${basename(file)}`
                        let state = await FileHandler.copyFile(source, target)
                        res.push({ file: file, state: state })
                    }
                })
                return res
            },
            async uninstall(mod) {
                const settings = useSettings()

                let res: IState[] = []
                let gameStorage = `${settings.settings.managerGame.gamePath}\\${this.installPath}`
                mod.modFiles.forEach(async file => {
                    let fileExt = extname(file)
                    if (fileExt === '.vpk') {
                        // let source = `${modStorage}\\${file}`
                        let target = `${gameStorage}\\${basename(file)}`
                        let state = FileHandler.deleteFile(target)
                        res.push({ file: file, state: state })
                    }
                })
                return res
            },
        },
    ],
    checkModType(mod) {
        return 1
    }
}