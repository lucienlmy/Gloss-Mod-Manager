import { basename, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 模拟农场 22 支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 265,
        steamAppID: 1248130,
        installdir: await join("Farming Simulator 22"),
        gameName: "Farming Simulator 22",
        gameExe: "FarmingSimulator2022.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1248130",
            },
            {
                name: "直接启动",
                exePath: await join("x64", "FarmingSimulator2022.exe"),
            },
        ],
        archivePath: await join(
            await FileHandler.getMyDocuments(),
            "My Games",
            "FarmingSimulator2022",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/61a9e018c601c.png",
        modType: [
            {
                id: 1,
                name: "通用类型",
                installPath: await join(
                    await FileHandler.getMyDocuments(),
                    "My Games",
                    "FarmingSimulator2022",
                    "mods",
                ),
                async install(mod) {
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "modDesc.xml",
                        true,
                        false,
                        false,
                    );
                },
                async uninstall(mod) {
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "modDesc.xml",
                        false,
                        false,
                        false,
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
            for (const item of mod.modFiles) {
                if ((await basename(item)).toLowerCase() === "moddesc.xml") {
                    return 1;
                }
            }

            return 99;
        },
    }) as ISupportedGames;
