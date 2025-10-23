import { execSync, spawn } from "child_process";
import path from "path";
import { parse } from "vdf-parser";
import axios from "axios";
export class Steam {
    // 获取steam安装目录
    public static getSteamInstallPath() {
        try {
            const regQueryCommand =
                'reg query "HKLM\\SOFTWARE\\Wow6432Node\\Valve\\Steam" /v InstallPath';
            const output = execSync(regQueryCommand).toString();
            const matches = output.match(/InstallPath\s+REG_SZ\s+(.*)/i);
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

    // 从steam获取所有的游戏列表
    public static getSteamGameList(): {
        appid: number;
        name: string;
        path: string;
    }[] {
        try {
            let steamPath = this.getSteamInstallPath();
            if (!steamPath) return [];

            // 读取 libraryfolders.vdf 文件
            let fileData = FileHandler.readFile(
                path.join(steamPath, "steamapps", "libraryfolders.vdf")
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
                    const manifestPath = path.join(
                        folder.path,
                        "steamapps",
                        `appmanifest_${appid}.acf`
                    );

                    try {
                        const manifestData = FileHandler.readFile(manifestPath);
                        if (manifestData) {
                            const manifest: any = parse(manifestData);
                            const gameName =
                                manifest.AppState?.name || `App ${appid}`;
                            const installdir =
                                manifest.AppState?.installdir || "";
                            // 获取游戏安装路径
                            const gamePath = this.getSteamGamePath(
                                appIdNum,
                                installdir
                            );
                            gameList.push({
                                appid: appIdNum,
                                name: gameName,
                                path: gamePath,
                            });
                        }
                    } catch (error) {
                        // 如果无法读取 manifest 文件，使用 appid 作为名称
                        const gamePath = this.getSteamGamePath(appIdNum, "");
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

    // 获取游戏安装目录
    public static getSteamGamePath(
        steamAppID: number,
        installdir: string = ""
    ) {
        try {
            let steamPath = this.getSteamInstallPath();
            if (!steamPath) return "";
            // console.log(steamPath);
            // C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf
            let fileData = FileHandler.readFile(
                path.join(steamPath, "steamapps", "libraryfolders.vdf")
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
                    return path.join(
                        gameRootPath,
                        "steamapps",
                        "common",
                        installdir
                    );
                }
            }
            return "";
        } catch (error) {
            return "";
        }
    }

    public static GetLastSteamId32() {
        try {
            // C:\Program Files (x86)\Steam\config\loginusers.vdf
            let steamPath = this.getSteamInstallPath();
            if (steamPath) {
                try {
                    let loginusers = FileHandler.readFile(
                        path.join(steamPath, "config", "loginusers.vdf")
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

    // 获取创意工坊列表
    public static getWorkshopList(
        appid: number,
        page: number,
        numperpage: number = 24,
        return_details: boolean = true
    ) {
        let key = "E51625A144E72EB1A25CFD59B3EAB8A4";
        const url = `https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/`;

        const params = {
            key: key,
            appid: appid,
            page: page,
            numperpage: numperpage,
            return_details: return_details,
        };
        return axios.get(url, { params });
    }

    // 下载创意工坊文件
    public getPublishedFileDetails(appid: number, fileId: string) {
        // console.log(steamcmd);
        // let cmd = `"${steamcmd}" +login anonymous +workshop_download_item ${appid} ${fileId} +quit`
        // console.log(cmd);
        // this.steamcmd.stdin.write(`workshop_download_item ${appid} ${fileId}`)
    }
}
