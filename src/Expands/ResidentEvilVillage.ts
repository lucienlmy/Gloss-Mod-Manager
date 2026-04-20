import { join, basename } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { Manager } from "@/lib/Manager";
import { ScanGame } from "@/lib/scan-game";

/**
 * @description 生化危机7 支持
 */
export const supportedGames = async () => ({
    GlossGameId: 253,
    steamAppID: 1196590,
    nexusMods: {
        game_domain_name: "residentevilvillage",
        game_id: 3669
    },
    installdir: "Resident Evil Village BIOHAZARD VILLAGE",
    gameName: "Resident Evil Village",
    gameExe: 're8.exe',
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/1196590'
        },
        {
            name: '直接启动',
            exePath: 're8.exe'
        }
    ],
    archivePath: await join(await ScanGame.getSteamInstallPath() || "", "userdata", await ScanGame.GetLastSteamId32(), "1196590", "remote"),
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/6095126f96a6d.png",
    modType: [
        {
            id: 2,
            name: "REFramework",
            installPath: "",
            async install(mod) {
                void mod;
                return Manager.generalInstall(mod, this.installPath ?? "", true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.generalUninstall(mod, this.installPath ?? "", true)
            }
        },
        {
            id: 1,
            name: "autorun",
            installPath: await join('reframework', 'autorun'),
            async install(mod) {
                void mod;
                if (!Manager.checkInstalled("REFramework", 202995)) return false
                return Manager.installByFolder(mod, this.installPath ?? "", 'autorun', true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFolder(mod, this.installPath ?? "", 'autorun', false)
            }
        },
        {
            id: 4,
            name: 'plugins',
            installPath: await join('reframework', 'plugins'),
            async install(mod) {
                void mod;
                if (!Manager.checkInstalled("REFramework", 202995)) return false
                return Manager.installByFolder(mod, this.installPath ?? "", 'plugins', true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFolder(mod, this.installPath ?? "", 'plugins', false)
            }
        },
        {
            id: 3,
            name: "模型替换",
            installPath: await join('natives'),
            async install(mod) {
                void mod;
                if (!Manager.checkInstalled("REFramework", 202995)) return false
                if (!Manager.checkInstalled("FirstNatives", 202971)) return false

                return Manager.installByFolder(mod, this.installPath ?? "", 'natives', true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.installByFolder(mod, this.installPath ?? "", 'natives', false)
            }
        },
        {
            id: 5,
            name: '主目录',
            installPath: "",
            async install(mod) {
                void mod;
                return Manager.generalInstall(mod, this.installPath ?? "", true)
            },
            async uninstall(mod) {
                void mod;
                return Manager.generalUninstall(mod, this.installPath ?? "", true)
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
        let natives = false
        let plugins = false
        let autorun = false
        let REFramework = false
        // if (mod.webId == 197869) return 2

        for (const item of mod.modFiles) {
            if (await basename(item) == 'dinput8.dll') REFramework = true
            if (item.toLowerCase().includes('natives')) natives = true
            if (item.toLowerCase().includes('autorun')) autorun = true
            if (item.toLowerCase().includes('plugins')) plugins = true
        }

        if (REFramework) return 2
        if (autorun) return 1
        if (plugins) return 4
        if (natives) return 3

        return 99
    }
}) as ISupportedGames;
