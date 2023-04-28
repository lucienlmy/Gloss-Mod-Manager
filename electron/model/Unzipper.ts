import { extractFull, Data } from 'node-7z'
import { execSync } from 'child_process'
import { join, dirname } from 'path'

export class Unzipper {

    private static get7zip() {
        let installPath = ''
        try {
            const output = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\7zFM.exe" /ve').toString();
            const match = output.match(/^(.*?)\s+REG_SZ\s+(.*)$/m);
            installPath = match && match[2];
            installPath = join(dirname(installPath), '7z.exe');
            console.log(installPath);
        } catch (err) {
            console.log(err);
        }
        return installPath
    }

    /**
     * @description 解压文件
     * @param source 需要解压的文件
     * @param target 解压到的目录
     * @returns 解压状态
     */
    public static unzip(source: string, target: string) {
        return new Promise((resolve, reject) => {
            let files: Data[] = []
            const myStream = extractFull(source, target, {
                $bin: this.get7zip(),
            })
            myStream.on('data', function (data) {
                files.push(data)
            })
            myStream.on('error', (err) => {
                reject(err)
            })
            myStream.on('end', function () {
                resolve(files)
            })

        })
    }
}