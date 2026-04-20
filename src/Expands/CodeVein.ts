import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { UnrealEngine } from "@/lib/UnrealEngine";

export const supportedGames = async () => ({
    GlossGameId: 207,
    steamAppID: 678960,
    nexusMods: {
        game_domain_name: "codevein",
        game_id: 2981
    },
    gameName: "CODE VEIN",
    installdir: "CodeVein",
    gameExe: 'CodeVein.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/678960'
        },
        {
            name: '直接启动',
            exePath: 'CodeVein.exe'
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Local", "CodeVein", "Saved"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/207.png",
    modType: await UnrealEngine.modType("CodeVein", false),
    checkModType: UnrealEngine.checkModType
}) as ISupportedGames;
