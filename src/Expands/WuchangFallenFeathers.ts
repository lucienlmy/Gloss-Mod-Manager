
import { join } from 'path'

export const supportedGames: ISupportedGames = {
    GlossGameId: 440,
    steamAppID: 2277560,
    nexusMods: {
        game_domain_name: "wuchangfallenfeathers",
        game_id: 7976
    },
    gameName: "Wuchang Fallen Feathers",
    installdir: "Wuchang Fallen Feathers",
    gameExe: 'Project_Plague.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/2277560'
        },
        {
            name: '直接启动',
            exePath: 'Project_Plague.exe'
        }
    ],
    // archivePath: join(FileHandler.GetAppData(), "Local", "Stalker2", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_68818e5553d86.jpg",
    modType: UnrealEngine.modType("Project_Plague", false),
    checkModType: UnrealEngine.checkModType
}