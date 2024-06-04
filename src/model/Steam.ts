import { execSync, spawn } from 'child_process';
import path from 'path';
import { FileHandler } from '@src/model/FileHandler'
import { parse } from 'vdf-parser'
import axios from 'axios';


export class Steam {

    // public steamcmd;

    // constructor() {
    //     let steamcmdPath = path.join(FileHandler.getResourcesPath(), 'steamcmd', 'steamcmd.exe')
    //     this.steamcmd = spawn(`steamcmd`, {
    //         shell: true,
    //         cwd: path.dirname(steamcmdPath)
    //     })

    //     this.steamcmd.stdout.on('data', (data) => {
    //         console.log(`stdout: ${data}`);
    //     });

    //     this.steamcmd.stderr.on('data', (data) => {
    //         console.log(`stderr: ${data}`);
    //     });
    //     this.steamcmd.on('error', (error) => {
    //         console.log(`error: ${error}`);
    //     })


    // }

    // 获取steam安装目录
    public static getSteamInstallPath() {
        try {
            const regQueryCommand = 'reg query "HKLM\\SOFTWARE\\Wow6432Node\\Valve\\Steam" /v InstallPath';
            const output = execSync(regQueryCommand).toString();
            const matches = output.match(/InstallPath\s+REG_SZ\s+(.*)/i);
            if (matches && matches[1]) {
                // console.log(matches);
                return matches[1];
            }
            return null
        } catch (error) {
            console.log(error);
            return null
        }
    }

    // 获取游戏安装目录
    public static getSteamGamePath(steamAppID: number, installdir: string = '') {
        let steamPath = this.getSteamInstallPath()
        if (!steamPath) return ""
        // console.log(steamPath);
        // C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf
        let fileData = FileHandler.readFile(path.join(steamPath, 'steamapps', 'libraryfolders.vdf'))
        if (fileData) {
            let data: any = parse(fileData)
            let gameRootPath = ''
            for (const folderId in data.libraryfolders) {
                const folder = data.libraryfolders[folderId];
                // console.log(folder);
                if (!folder.apps) continue;
                if (folder.apps.hasOwnProperty(steamAppID)) {
                    console.log(`"${steamAppID}" is found in folder "${folder.path}".`);
                    gameRootPath = folder.path
                    break;
                }
            }
            if (gameRootPath != '') {
                return path.join(gameRootPath, 'steamapps', 'common', installdir)
            }
        }

        return ""
    }

    // 获取创意工坊列表
    public static getWorkshopList(appid: number, page: number, numperpage: number = 24, return_details: boolean = true) {
        let key = "E51625A144E72EB1A25CFD59B3EAB8A4"
        const url = `https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/`;

        const params = {
            key: key,
            appid: appid,
            page: page,
            numperpage: numperpage,
            return_details: return_details
        }
        return axios.get(url, { params })
    }

    // 下载创意工坊文件
    public getPublishedFileDetails(appid: number, fileId: string) {

        // console.log(steamcmd);

        // let cmd = `"${steamcmd}" +login anonymous +workshop_download_item ${appid} ${fileId} +quit`

        // console.log(cmd);
        // this.steamcmd.stdin.write(`workshop_download_item ${appid} ${fileId}`)

    }
}
