/**
 * 解压文件
 */

import { extractFull, Data } from 'node-7z'
import { ipcRenderer } from 'electron'

export class Unzipper {

    private static async get7zip(): Promise<string> {

        let zipPath = await ipcRenderer.invoke("get-7z-path")
        return zipPath
    }

    /**
     * @description 解压文件
     * @param source 需要解压的文件
     * @param target 解压到的目录
     * @returns 解压状态
     */
    public static unzip(source: string, target: string): Promise<Data[]> {
        return new Promise(async (resolve, reject) => {
            let files: Data[] = []
            const myStream = extractFull(source, target, {
                $bin: await this.get7zip(),
                charset: 'utf-8'
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