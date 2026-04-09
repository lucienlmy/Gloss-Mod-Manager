import { Command } from "@tauri-apps/plugin-shell";
import { parse } from "vdf-parser";
import { join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";

export class ScanGame {
    // 获取steam安装目录
    public static async getSteamInstallPath() {
        try {
            const result = await Command.create("reg", [
                "query",
                "HKLM\\SOFTWARE\\Wow6432Node\\Valve\\Steam",
                "/v",
                "InstallPath",
            ]).execute();
            const matches = result.stdout.match(/InstallPath\s+REG_SZ\s+(.*)/i);
            if (matches && matches[1]) {
                // console.log(matches);
                return matches[1];
            }
            return null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // 获取游戏安装目录
    public static async getSteamGamePath(
        steamAppID: number,
        installdir: string = "",
    ) {
        try {
            let steamPath = await this.getSteamInstallPath();
            if (!steamPath) return "";
            // console.log(steamPath);
            // C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf
            let fileData = await FileHandler.readFile(
                await join(steamPath, "steamapps", "libraryfolders.vdf"),
            );
            // console.log(fileData);

            if (fileData) {
                let data: any = parse(fileData);
                let gameRootPath = "";
                for (const folderId in data.libraryfolders) {
                    const folder = data.libraryfolders[folderId];
                    // console.log(folder);
                    if (!folder.apps) continue;
                    if (folder.apps.hasOwnProperty(steamAppID)) {
                        gameRootPath = folder.path;
                        break;
                    }
                }
                if (gameRootPath != "") {
                    return await join(
                        gameRootPath,
                        "steamapps",
                        "common",
                        installdir,
                    );
                }
            }
            return "";
        } catch (error) {
            return "";
        }
    }

    // 从steam获取所有的游戏列表
    public static async getSteamGameList(): Promise<
        {
            appid: number;
            name: string;
            path: string;
        }[]
    > {
        try {
            let steamPath = await this.getSteamInstallPath();
            if (!steamPath) return [];

            // 读取 libraryfolders.vdf 文件
            let fileData = await FileHandler.readFile(
                await join(steamPath, "steamapps", "libraryfolders.vdf"),
            );

            if (!fileData) return [];

            let data: any = parse(fileData);
            let gameList: { appid: number; name: string; path: string }[] = [];

            // 遍历所有库文件夹
            for (const folderId in data.libraryfolders) {
                const folder = data.libraryfolders[folderId];
                if (!folder.apps) continue;

                // 遍历该文件夹中的所有应用
                for (const appid in folder.apps) {
                    const appIdNum = parseInt(appid);

                    // 尝试从 appmanifest 文件读取游戏名称
                    const manifestPath = await join(
                        folder.path,
                        "steamapps",
                        `appmanifest_${appid}.acf`,
                    );

                    try {
                        const manifestData =
                            await FileHandler.readFile(manifestPath);
                        if (manifestData) {
                            const manifest: any = parse(manifestData);
                            const gameName =
                                manifest.AppState?.name || `App ${appid}`;
                            const installdir =
                                manifest.AppState?.installdir || "";
                            // 获取游戏安装路径
                            const gamePath = await this.getSteamGamePath(
                                appIdNum,
                                installdir,
                            );
                            gameList.push({
                                appid: appIdNum,
                                name: gameName,
                                path: gamePath,
                            });
                        }
                    } catch (error) {
                        // 如果无法读取 manifest 文件，使用 appid 作为名称
                        const gamePath = await this.getSteamGamePath(
                            appIdNum,
                            "",
                        );
                        gameList.push({
                            appid: appIdNum,
                            name: `App ${appid}`,
                            path: gamePath,
                        });
                    }
                }
            }

            return gameList;
        } catch (error) {
            console.error("Error getting Steam game list:", error);
            return [];
        }
    }

    public static async GetLastSteamId32() {
        try {
            // C:\Program Files (x86)\Steam\config\loginusers.vdf
            let steamPath = await this.getSteamInstallPath();
            if (steamPath) {
                try {
                    let loginusers = await FileHandler.readFile(
                        await join(steamPath, "config", "loginusers.vdf"),
                    );
                    let data: any = parse(loginusers);

                    let lastSteamId64 = BigInt(0);
                    let lastSteamId32 = BigInt(0);
                    const steamBaseBigInt = BigInt("76561197960265728");

                    for (let steamid in data["users"]) {
                        const item = data["users"][steamid];
                        let back = data["users"][lastSteamId64.toString()];
                        // 获取 item.Timestamp 最大 的 steamid 赋值给 lastSteamId
                        if (lastSteamId64 == BigInt(0)) {
                            lastSteamId64 = BigInt(steamid);
                        } else if (
                            back &&
                            item["Timestamp"] > back["Timestamp"]
                        ) {
                            lastSteamId64 = BigInt(steamid);
                        }
                    }
                    if (lastSteamId64 != BigInt(0)) {
                        lastSteamId32 = lastSteamId64 - steamBaseBigInt;
                    }
                    return lastSteamId32.toString();
                } catch (error) {
                    return "";
                }
            }
            return "";
        } catch (error) {
            return "";
        }
    }
}
