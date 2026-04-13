import { Command } from "@tauri-apps/plugin-shell";
import { parse } from "vdf-parser";
import { homeDir, join } from "@tauri-apps/api/path";
import { platform } from "@tauri-apps/plugin-os";
import { FileHandler } from "@/lib/FileHandler";

export class ScanGame {
    private static async isValidSteamInstallPath(steamPath: string) {
        const libraryfoldersPath = await join(
            steamPath,
            "steamapps",
            "libraryfolders.vdf",
        );
        if (await FileHandler.fileExists(libraryfoldersPath)) {
            return true;
        }

        const loginusersPath = await join(steamPath, "config", "loginusers.vdf");
        return FileHandler.fileExists(loginusersPath);
    }

    private static async findSteamInstallPathByCandidates(candidates: string[]) {
        for (const candidatePath of candidates) {
            if (!candidatePath) {
                continue;
            }

            if (await this.isValidSteamInstallPath(candidatePath)) {
                return candidatePath;
            }
        }

        return null;
    }

    private static async getWindowsSteamInstallPath() {
        try {
            const result = await Command.create("reg", [
                "query",
                "HKLM\\SOFTWARE\\Wow6432Node\\Valve\\Steam",
                "/v",
                "InstallPath",
            ]).execute();
            const matches = result.stdout.match(/InstallPath\s+REG_SZ\s+(.*)/i);

            if (matches && matches[1]) {
                return matches[1].trim();
            }

            return null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    private static async getMacSteamInstallPath() {
        const userHomeDir = await homeDir();

        return this.findSteamInstallPathByCandidates([
            await join(userHomeDir, "Library", "Application Support", "Steam"),
        ]);
    }

    private static async getLinuxSteamInstallPath() {
        const userHomeDir = await homeDir();

        return this.findSteamInstallPathByCandidates([
            await join(userHomeDir, ".local", "share", "Steam"),
            await join(userHomeDir, ".steam", "steam"),
            await join(userHomeDir, ".steam", "root"),
            await join(userHomeDir, ".steam", "debian-installation"),
            await join(
                userHomeDir,
                ".var",
                "app",
                "com.valvesoftware.Steam",
                ".local",
                "share",
                "Steam",
            ),
        ]);
    }

    // 获取steam安装目录
    public static async getSteamInstallPath() {
        try {
            switch (platform()) {
                case "windows":
                    return await this.getWindowsSteamInstallPath();
                case "macos":
                    return await this.getMacSteamInstallPath();
                case "linux":
                    return await this.getLinuxSteamInstallPath();
                default:
                    return null;
            }
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
            console.log({ steamPath, fileData });

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
            return undefined;
        } catch (error) {
            return undefined;
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
