import { join, basename } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";
import { FileHandler } from "@/lib/FileHandler";

/**
 * @description 动物园之星 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 327,
    steamAppID: 703080,
    nexusMods: {
        game_domain_name: "planetzoo",
        game_id: 3100
    },
    installdir: await join("Planet Zoo"),
    gameName: "Planet Zoo",
    gameExe: "PlanetZoo.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/703080"
        },
        {
            name: "直接启动",
            exePath: await join("PlanetZoo.exe")
        }
    ],
    archivePath: await join(await FileHandler.GetAppData(), "..", "Saved Games", "Frontier Developments", "Planet Zoo"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/653a085c9ddd7.webp",
    modType: [
        {
            id: 1,
            name: "Mods",
            installPath: await join("win64", "ovldata"),
            async install(mod) {
                void mod;
                return Manager.installByFile(mod, this.installPath ?? "", 'manifest.xml', true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFile(mod, this.installPath ?? "", 'manifest.xml', false)
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
            if ((await basename(item)).toLowerCase() == 'manifest.xml') mods = true
        }

        if (mods) return 1

        return 99
    }
}) as ISupportedGames;
