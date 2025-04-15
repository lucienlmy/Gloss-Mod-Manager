/**
 * @description 美国末日2 支持
 */


import { Manager } from '@/model/Manager'
import { extname, basename, join } from 'path'

// console.log(settings.settings.managerGame);

export const supportedGames: ISupportedGames = {
    GlossGameId: 429,
    steamAppID: 2531310,
    nexusMods: {
        game_domain_name: "thelastofuspart2",
        game_id: 7521
    },
    installdir: "The Last of Us Part II",
    gameName: "The Last of Us Part 2",
    gameExe: 'tlou-ii.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/2531310'
        },
        {
            name: '直接启动',
            exePath: 'tlou-ii.exe'
        }
    ],
    gameCoverImg: "https://mod.3dmgame.com/static/upload/logo/croppedImg_67fdc9247cc4b.jpg",
    modType: [
        {
            id: 1,
            name: 'modloader',
            // installPath: '\\left4dead2\\addons',
            installPath: join(''),
            async install(mod) {
                return Manager.generalInstall(mod, this.installPath ?? "", true)
            },
            async uninstall(mod) {
                return Manager.generalUninstall(mod, this.installPath ?? "", true)
            },
        },
        {
            id: 2,
            name: 'mods',
            installPath: join('mods'),
            async install(mod) {
                return Manager.generalInstall(mod, this.installPath ?? "", false)
            },
            async uninstall(mod) {
                return Manager.generalUninstall(mod, this.installPath ?? "", false)
            },
        },
        {
            id: 99,
            name: "未知",
            installPath: "",
            async install(mod) {
                ElMessage.warning("未知类型, 请手动安装")
                return false
            },
            async uninstall(mod) {
                return true
            }
        }
    ],
    checkModType(mod) {
        let modloader = false
        let mods = false

        mod.modFiles.forEach(item => {
            if (basename(item) == 'winmm.dll') modloader = true
            if (extname(item) == '.psarc') mods = true
        })

        if (modloader) return 1
        if (mods) return 2

        return 99
    }
}