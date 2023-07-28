import { execSync } from 'child_process';
import path from 'path';
import { FileHandler } from '@src/model/FileHandler'
import { parse } from 'vdf-parser'

export class Steam {
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

    public static getSteamGamePath(steamAppID: number, installdir: string = '') {
        let steamPath = this.getSteamInstallPath()
        if (!steamPath) return undefined
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

        return undefined
    }
}
