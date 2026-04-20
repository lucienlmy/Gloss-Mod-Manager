import { join, basename } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";
import { FileHandler } from "@/lib/FileHandler";

/**
 * @description 泰坦陨落2 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 332,
    steamAppID: 1237970,
    nexusMods: {
        game_domain_name: "titanfall2",
        game_id: 2532
    },
    installdir: await join("Titanfall2"),
    gameName: "Titanfall 2",
    gameExe: "Titanfall2.exe",
    Thunderstore: {
        community_identifier: "northstar",
    },
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/1237970"
        },
        {
            name: "激活Mod启动",
            exePath: await join("NorthstarLauncher.exe")
        }
    ],
    archivePath: await join(await FileHandler.getMyDocuments(), "Respawn", "Titanfall2"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/65a9d3b2453ae.webp",
    modType: [
        {
            id: 1,
            name: "mods",
            installPath: await join("R2Northstar", "mods"),
            async install(mod) {
                void mod;
                return Manager.installByFile(mod, this.installPath ?? "", "mod.json", true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFile(mod, this.installPath ?? "", "mod.json", false)
            }
        },
        {
            id: 2,
            name: "Northstar",
            installPath: "",
            async install(mod) {
                void mod;
                return Manager.installByFileSibling(mod, this.installPath ?? "", "NorthstarLauncher.exe", true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFileSibling(mod, this.installPath ?? "", "NorthstarLauncher.exe", false)
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
        let Northstar = false

        for (const item of mod.modFiles) {
            if (await basename(item) == 'mod.json') mods = true
            if (await basename(item) == 'NorthstarLauncher.exe') Northstar = true
        }

        if (Northstar) return 2
        if (mods) return 1

        return 99
    }
}) as ISupportedGames;
