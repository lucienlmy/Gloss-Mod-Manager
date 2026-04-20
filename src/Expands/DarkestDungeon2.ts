import { join } from "@tauri-apps/api/path";
import { Manager } from "@/lib/Manager";
import { FileHandler } from "@/lib/FileHandler";
import { UnityGame } from "@/lib/UnityGame";

/**
 * @description 暗黑地牢2 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 353,
    steamAppID: 1940340,
    nexusMods: {
        game_domain_name: "darkestdungeon2",
        game_id: 4113
    },
    installdir: await join("Darkest Dungeon® II"),
    gameName: "Darkest Dungeon 2",
    gameExe: "Darkest Dungeon II.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1940340"
        },
        {
            name: "直接启动",
            exePath: await join("Darkest Dungeon II.exe")
        }
    ],
    archivePath: await join(await FileHandler.getMyDocuments(), "Darkest"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/664ef0d003b8a.webp",
    modType: [
        ...(await UnityGame.modType()),
        {
            id: 4,
            name: "StreamingAssets",
            installPath: await join("Darkest Dungeon II_Data", "StreamingAssets"),
            async install(mod) {
                void mod;
                return Manager.installByFolder(mod, this.installPath ?? "", "StreamingAssets", true, false, true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFolder(mod, this.installPath ?? "", "StreamingAssets", false, false, true)
            }
        }
    ],
    async checkModType(mod) {
        let id = await UnityGame.checkModType(mod)

        if (id == 99) {
            for (const item of mod.modFiles) {
                if (FileHandler.getFolderFromPath(item, "StreamingAssets")) {
                    id = 4
                }
            }
        }

        return id
    }
}) as ISupportedGames;
