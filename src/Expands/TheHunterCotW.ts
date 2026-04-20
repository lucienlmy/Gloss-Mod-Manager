import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";
import { FileHandler } from "@/lib/FileHandler";

/**
 * @description 猎人 荒野的召唤 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 322,
    steamAppID: 518790,
    nexusMods: {
        game_domain_name: "thehuntercallofthewild",
        game_id: 3158
    },
    installdir: await join("theHunterCotW"),
    gameName: "The Hunter CotW",
    gameExe: "theHunterCotW_F.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/518790"
        },
        {
            name: "直接启动",
            exePath: await join("theHunterCotW_F.exe")
        }
    ],
    archivePath: await join(await FileHandler.getMyDocuments(), "Avalanche Studios", "theHunter Call of the Wild", "Saves"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/64e2df9a8310c.webp",
    modType: [
        {
            id: 1,
            name: "dropzone",
            installPath: await join("dropzone"),
            async install(mod) {
                void mod;
                return Manager.installByFolder(mod, this.installPath ?? "", "dropzone", true, false, true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFolder(mod, this.installPath ?? "", "dropzone", false, false, true)
            }
        },
        {
            id: 99,
            name: "未知",
            installPath: "",
            async install(mod) {
                void mod;
                ElMessage.warning("未知类型, 请手动安装")
                return false
            },
            async uninstall(mod) {
                void mod;
                return true
            }
        }
    ],
    async checkModType(mod) {
        let dropzone = false

        for (const item of mod.modFiles) {
            let list = FileHandler.pathToArray(item)
            if (list.includes('dropzone')) dropzone = true
        }

        if (dropzone) return 1

        return 99
    }
}) as ISupportedGames;
