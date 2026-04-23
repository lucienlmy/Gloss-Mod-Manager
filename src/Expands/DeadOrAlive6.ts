import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 死或生 6 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 182,
        steamAppID: 838380,
        installdir: await join("Dead or Alive 6"),
        gameName: "Dead or Alive 6",
        gameExe: "DOA6.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/838380",
            },
            {
                name: "直接启动",
                exePath: "DOA6.exe",
            },
        ],
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/182.jpg",
        modType: [
            {
                id: 1,
                name: "mods",
                installPath: await join("REDELBE", "Layer2"),
                async install(mod) {
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "mod.ini",
                        true,
                    );
                },
                async uninstall(mod) {
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "mod.ini",
                        false,
                    );
                },
            },
            {
                id: 2,
                name: "Redelbe",
                installPath: "",
                async install(mod) {
                    return Manager.installByFileSibling(
                        mod,
                        this.installPath ?? "",
                        "dinput8.dll",
                        true,
                    );
                },
                async uninstall(mod) {
                    return Manager.installByFileSibling(
                        mod,
                        this.installPath ?? "",
                        "dinput8.dll",
                        false,
                    );
                },
            },
            {
                id: 3,
                name: "游戏根目录",
                installPath: "",
                async install(mod) {
                    return Manager.generalInstall(
                        mod,
                        this.installPath ?? "",
                        true,
                    );
                },
                async uninstall(mod) {
                    return Manager.generalUninstall(
                        mod,
                        this.installPath ?? "",
                        true,
                    );
                },
            },
            {
                id: 99,
                name: "未知",
                installPath: "",
                async install(_mod) {
                    ElMessage.warning("未知类型，请手动安装");
                    return false;
                },
                async uninstall(_mod) {
                    return true;
                },
            },
        ],
        async checkModType(mod) {
            let redelbe = false;
            let mods = false;

            for (const item of mod.modFiles) {
                if (await FileHandler.compareFileName(item, "dinput8.dll"))
                    redelbe = true;
                if (await FileHandler.compareFileName(item, "mod.ini"))
                    mods = true;
            }

            if (mods) return 1;
            if (redelbe) return 2;

            return 99;
        },
    }) as ISupportedGames;
