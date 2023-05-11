/**
 * 解压文件
 */

import { extractFull, Data } from 'node-7z'
import { Config } from '@src/model/Config'

export class Unzipper {

    private static get7zip(): string {
        let config = Config.getConfig()
        return config.UnzipPath
    }

    /**
     * @description 解压文件
     * @param source 需要解压的文件
     * @param target 解压到的目录
     * @returns 解压状态
     */
    public static unzip(source: string, target: string): Promise<Data[]> {
        console.log(target);

        return new Promise((resolve, reject) => {
            let files: Data[] = []
            const myStream = extractFull(source, target, {
                $bin: this.get7zip(),
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