/**
 * @description 暗黑地牢 支持
 */

import { join, basename } from "node:path";

export const supportedGames: ISupportedGames = {
    GlossGameId: 88,
    steamAppID: 262060,
    nexusMods: {
        game_domain_name: "darkestdungeon",
        game_id: 804,
    },
    installdir: join("DarkestDungeon", "_windows", "win64"),
    gameName: "Darkest Dungeon",
    gameExe: [
        {
            name: "Darkest.exe",
            rootPath: join("..", ".."),
        },
    ],
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/262060",
        },
        {
            name: "直接启动",
            exePath: join("_windows", "win64", "Darkest.exe"),
        },
    ],
    gameCoverImg: "https://assets-mod.3dmgame.com/static/upload/game/88.jpg",
    modType: [
        {
            id: 1,
            name: "mods",
            installPath: join("mods"),
            async install(mod) {
                return Manager.installByFile(
                    mod,
                    this.installPath ?? "",
                    "project.xml",
                    true,
                    false,
                    true,
                );
            },
            async uninstall(mod) {
                return Manager.installByFile(
                    mod,
                    this.installPath ?? "",
                    "project.xml",
                    false,
                    false,
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
        let mods = false;
        mod.modFiles.forEach((item) => {
            if (basename(item) == "project.xml") mods = true;
        });

        if (mods) return 1;

        return 99;
    },
};
