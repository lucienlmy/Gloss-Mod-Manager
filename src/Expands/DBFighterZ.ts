import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

export const supportedGames = async () => ({
    GlossGameId: 157,
    steamAppID: 678950,
    nexusMods: {
        game_domain_name: "dragonballfighterz",
        game_id: 3948
    },
    gameName: "DRAGON BALL FighterZ",
    installdir: "DRAGON BALL FighterZ",
    gameExe: 'DBFighterZ.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/678950'
        },
        {
            name: '直接启动',
            exePath: 'DBFighterZ.exe'
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "DBFighterZ", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/157.jpg",
    modType: await UnrealEngine.modType("RED", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
