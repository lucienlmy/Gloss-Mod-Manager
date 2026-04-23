import { basename, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

/**
 * @description 哈迪斯 2 支持
 */
async function runModImporter() {
    const { gameStorage } = await Manager.getContext();

    if (!gameStorage) {
        return true;
    }

    const modImporterPath = await join(
        gameStorage,
        "Content",
        "modimporter.exe",
    );
    if (!(await FileHandler.fileExists(modImporterPath))) {
        ElMessage.warning(
            "未找到 modimporter.exe，Mod 可能不会生效，请先安装 ModImporter。",
        );
        return true;
    }

    await FileHandler.runExe(modImporterPath);
    return true;
}

export const supportedGames = async () =>
    ({
        GlossGameId: 349,
        steamAppID: 1145350,
        nexusMods: {
            game_domain_name: "hades2",
            game_id: 6354,
        },
        installdir: await join("Hades II", "Ship"),
        gameName: "Hades2",
        Thunderstore: {
            community_identifier: "hades-ii",
        },
        gameExe: [
            {
                name: "Hades2.exe",
                rootPath: [".."],
            },
        ],
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/1145350",
            },
            {
                name: "直接启动",
                exePath: await join("Ship", "Hades2.exe"),
            },
        ],
        archivePath: await join(
            await FileHandler.GetAppData(),
            "..",
            "Saved Games",
            "Hades II",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/663add9906fe2.webp",
        modType: [
            {
                id: 1,
                name: "Mods",
                installPath: await join("Content", "Mods"),
                async install(mod) {
                    await Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "modfile.txt",
                        true,
                        false,
                        true,
                        false,
                    );
                    await runModImporter();
                    return true;
                },
                async uninstall(mod) {
                    await Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "modfile.txt",
                        false,
                        false,
                        true,
                        false,
                    );
                    await runModImporter();
                    return true;
                },
            },
            {
                id: 2,
                name: "ModImporter",
                installPath: await join("Content"),
                async install(mod) {
                    return Manager.installByFileSibling(
                        mod,
                        this.installPath ?? "",
                        "modimporter.exe",
                        true,
                    );
                },
                async uninstall(mod) {
                    return Manager.installByFileSibling(
                        mod,
                        this.installPath ?? "",
                        "modimporter.exe",
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
            let mods = false;
            let modImporter = false;

            for (const item of mod.modFiles) {
                if ((await basename(item)) === "modfile.txt") mods = true;
                if ((await basename(item)) === "modimporter.exe")
                    modImporter = true;
            }

            if (modImporter) return 2;
            if (mods) return 1;

            return 99;
        },
    }) as ISupportedGames;
