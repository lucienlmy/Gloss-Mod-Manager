/**
 * @description 上古卷轴4 湮灭 重制版 支持
 */


import { Manager } from '@/model/Manager'
import { join, dirname, extname, basename } from 'path'


async function handerEsp(mod: IModInfo, installPath: string, isInstall: boolean) {
    const manager = useManager()

    const pluginsPath = join(manager.gameStorage, installPath, 'Plugins.txt')

    const pluginsFile = await FileHandler.readFileSync(pluginsPath, '')

    const pluginsFileList = pluginsFile.split('\n').filter(item => item.trim() != '')

    let espFileList: string[] = mod.modFiles.filter(item => extname(item) == '.esp')

    if (isInstall) {
        espFileList.forEach(esp => {
            let name = basename(esp)
            // console.log(pluginsFileList);
            // 判断是否已经存在
            if (!pluginsFileList.includes(name)) {
                pluginsFileList.push(name)
            }
        })
    } else {
        espFileList.forEach(esp => {
            let name = basename(esp)
            // console.log(pluginsFileList);
            // 判断是否已经存在
            if (pluginsFileList.includes(name)) {
                pluginsFileList.splice(pluginsFileList.indexOf(name), 1)
            }
        })
    }

    console.log(pluginsFileList);


    // 写入文件
    await FileHandler.writeFile(pluginsPath, pluginsFileList.join('\n'))

    return Manager.installByFileSibling(mod, installPath, '.esp', isInstall, true)
}


export const supportedGames: ISupportedGames = {
    GlossGameId: 430,
    steamAppID: 2623190,
    nexusMods: {
        game_domain_name: "oblivionremastered",
        game_id: 7587
    },
    installdir: join("Oblivion Remastered"),
    gameName: "Oblivion Remastered",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/2623190"
        },
        {
            name: "直接启动",
            exePath: "OblivionRemastered.exe"
        }
    ],
    gameExe: [
        {
            name: "OblivionRemastered.exe",
            rootPath: ""
        },
        {
            name: 'OblivionRemastered-Win64-Shipping.exe',
            rootPath: "../../../"
        },
        {
            name: 'OblivionRemastered-WinGDK-Shipping.exe',
            rootPath: "../../../"
        },
    ],
    // archivePath: join(FileHandler.GetAppData(), "Local", "b1", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_68084078343d1.jpg",
    modType: [
        ...UnrealEngine.modType("OblivionRemastered", false),
        {
            id: 6,
            name: "游戏根目录",
            installPath: join(),
            async install(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "OblivionRemastered", true, true)
            },
            async uninstall(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "OblivionRemastered", false, true)
            }
        },
        {
            id: 7,
            name: 'Data',
            installPath: join("OblivionRemastered", "Content", "Dev", "ObvData", "Data"),
            async install(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "Data", true)
            },
            async uninstall(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "Data", false)
            }
        },
        {
            id: 8,
            name: 'esp',
            installPath: join("OblivionRemastered", "Content", "Dev", "ObvData", "Data"),
            async install(mod) {
                return handerEsp(mod, this.installPath ?? "", true)
            },
            async uninstall(mod) {
                return handerEsp(mod, this.installPath ?? "", false)
            }
        }
    ],
    checkModType(mod) {
        let rootPath = false
        let esp = false
        let data = false
        mod.modFiles.forEach(item => {
            // 路径中是否有 Scripts
            let arr = FileHandler.pathToArray(item)
            if (arr.includes("OblivionRemastered")) rootPath = true
            if (extname(item) == '.esp') esp = true
            if (arr.includes("Data")) data = true
        })

        if (esp) return 8
        if (rootPath) return 6
        if (data) return 7

        let type = UnrealEngine.checkModType(mod)
        return type
    }
}