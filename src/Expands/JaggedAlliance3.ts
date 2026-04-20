import { join, basename } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";
import { FileHandler } from "@/lib/FileHandler";

/**
 * @description 铁血联盟3 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 318,
    steamAppID: 1084160,
    nexusMods: {
        game_domain_name: "jaggedalliance3",
        game_id: 5559
    },
    installdir: await join("Jagged Alliance 3"),
    gameName: "Jagged Alliance 3",
    gameExe: "JA3.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1084160"
        },
        {
            name: "直接启动",
            exePath: await join("JA3.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "Roaming", "Jagged Alliance 3"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/64be23bb84fe3.webp",
    modType: [
        {
            id: 1,
            name: "通用类型",
            installPath: await join(await FileHandler.GetAppData(), "Roaming", "Jagged Alliance 3", "Mods"),
            async install(mod) {
                void mod;
                return Manager.installByFile(mod, this.installPath ?? "", 'metadata.lua', true, false, false)
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFile(mod, this.installPath ?? "", 'metadata.lua', false, false, false)
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
        let mods = false

        for (const item of mod.modFiles) {
            if (await basename(item) == 'metadata.lua') mods = true
        }

        if (mods) return 1

        return 99
    }
}) as ISupportedGames;
