/**
 * @description 仁王3 支持
 */

import { basename, join, extname } from "node:path";
import { ElMessage } from "element-plus";
import { FileHandler } from "@/model/FileHandler";

async function runTools() {
    const manager = useManager();
    const toolsPath = join(
        manager.gameStorage,
        "package",
        "yumia_mod_insert_into_rdb.exe",
    );

    FileHandler.runExe(toolsPath);
}

export const supportedGames: ISupportedGames = {
    GlossGameId: 486,
    steamAppID: 3681010,
    nexusMods: {
        game_domain_name: "nioh3",
        game_id: 3660,
    },
    installdir: join("Nioh3"),
    gameName: "Nioh 3",
    gameExe: "Nioh3.exe",
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/3681010",
        },
        {
            name: "直接启动",
            exePath: join("Nioh3.exe"),
        },
    ],
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_699ec8ac99e3b.png",
    modType: [
        {
            id: 1,
            name: "tools",
            installPath: join("package"),
            async install(mod) {
                return Manager.installByFileSibling(
                    mod,
                    this.installPath ?? "",
                    ".exe",
                    true,
                    true,
                );
            },
            async uninstall(mod) {
                return Manager.installByFileSibling(
                    mod,
                    this.installPath ?? "",
                    ".exe",
                    false,
                    true,
                );
            },
        },
        {
            id: 2,
            name: "fdata",
            installPath: join("package"),
            async install(mod) {
                await Manager.installByFileSibling(
                    mod,
                    this.installPath ?? "",
                    ".fdata",
                    true,
                    true,
                );
                runTools();
                return true;
            },
            async uninstall(mod) {
                await Manager.installByFileSibling(
                    mod,
                    this.installPath ?? "",
                    ".fdata",
                    false,
                    true,
                );
                runTools();
                return true;
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
            async install(mod) {
                ElMessage.warning("未知类型, 请手动安装");
                return false;
            },
            async uninstall(mod) {
                return true;
            },
        },
    ],
    checkModType(mod) {
        let tools = false;
        let fdata = false;
        mod.modFiles.forEach((item) => {
            // 判断目录是否包含 folderList
            let list = FileHandler.pathToArray(item);
            if (basename(item) == "yumia_mod_insert_into_rdb.exe") tools = true;
            // if (list.some(item => folderList.includes(item))) rootFolder = true
            if (extname(item) == ".fdata") fdata = true;
            // if (extname(item) == '.dll') scripts = true
            // if (basename(item) == 'install.xml') lml = true
        });

        if (tools) return 1;
        if (fdata) return 2;

        return 99;
    },
};
