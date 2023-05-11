/**
 * 下载管理
 */

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import { FileHandler } from "@src/model/FileHandler"
import { DownloadStatus, IDownloadTask } from "@src/model/Interfaces"

export class Download {

    public id: number
    private url: string
    private dest: string;
    public task: IDownloadTask;
    private request: http.ClientRequest | undefined;
    private fileStream: fs.WriteStream | undefined;
    public onProgress?: (downloadedSize: number, totalSize: number, speed: number) => void


    public constructor(task: IDownloadTask, dest: string, onProgress?: (downloadedSize: number, totalSize: number, speed: number) => void) {
        this.task = task
        this.id = task.id
        this.url = task.link
        this.dest = dest
        this.onProgress = onProgress
    }

    /**
     * 开始下载
     * @param onProgress 
     */
    public start(): Promise<void> {

        return new Promise((resolve, reject) => {

            let dest = this.dest
            let url = this.url

            FileHandler.ensureDirectoryExistence(dest + '.downloaded')   // 创建文件
            const downloadedSoFar = parseInt(FileHandler.readFile(`${dest}.downloaded`, '0'), 10) || 0;
            let startTime: number | undefined;

            this.request = https.get(url, { headers: { Range: `bytes=${downloadedSoFar}-` } }, response => {
                if (response.statusCode === 206) {
                    // Partial content received, continue downloading
                } else if (response.statusCode === 200) {
                    // Starting a new download
                    fs.writeFileSync(dest, '');
                } else {
                    console.log(`Failed to get '${url}' (${response.statusCode})`);
                    return;
                }

                const totalSize = downloadedSoFar + parseInt(response.headers['content-length'] ?? '0', 10);
                let downloadedSize = downloadedSoFar;

                this.fileStream = fs.createWriteStream(dest, { flags: 'a' }); // Append mode
                // response.pipe(fileStream);

                if (downloadedSoFar != 0) {
                    console.log(`断点续传: ${downloadedSoFar} / ${totalSize}`);
                }

                this.task.state = DownloadStatus.DOWNLOADING
                response.on('data', chunk => {

                    if (this.task.state == DownloadStatus.PAUSED) return

                    downloadedSize += chunk.length;
                    this.fileStream?.write(chunk);

                    if (!startTime) {
                        startTime = Date.now();
                    }

                    const timeElapsed = Date.now() - startTime;
                    const speed = Math.round(downloadedSize / timeElapsed * 1000);

                    if (this.onProgress) {
                        this.onProgress((downloadedSize), totalSize, speed);
                    }

                    fs.writeFileSync(dest + '.downloaded', (downloadedSize).toString(), { encoding: 'utf-8' });

                    if (downloadedSize >= totalSize) {
                        // 下载完毕
                        this.task.state = DownloadStatus.COMPLETED
                        this.fileStream?.close();
                        fs.unlinkSync(dest + '.downloaded');
                    }
                });

                response.on('end', () => {
                    console.log(`end`);
                    this.fileStream?.close();
                    // this.task.state = DownloadStatus.COMPLETED
                    resolve();
                })
                response.on('close', () => {
                    this.fileStream?.close();
                });

                response.on('error', err => {
                    console.log(err);
                    reject(err);
                })

                this.fileStream?.on('finish', () => {
                    this.fileStream?.close();
                    // fs.unlinkSync(dest + '.downloaded');
                });

            });
            this.request.on('error', err => {
                console.log(err);
            });
        })
    }

    // /**
    //  * 监听下载 进度
    //  * @param downloadedSize 已下载大小
    //  * @param totalSize 总大小
    //  * @param speed 下载速度
    //  */
    // private onProgress(downloadedSize: number, totalSize: number, speed: number) {
    //     console.log(`${downloadedSize} | ${totalSize} | ${speed}`);
    //     console.log(this.task);
    //     this.task.speed = speed
    //     // this.task.speed = speed
    //     // this.task.totalSize = totalSize
    //     // this.task.downloadedSize = downloadedSize
    //     // // 状态
    //     // this.task.state = 1
    //     // if (downloadedSize == totalSize) this.task.state = DownloadStatus.COMPLETED
    // }


    /**
     * 暂停下载
     */
    public pause() {
        this.task.state = DownloadStatus.PAUSED
        this.request?.end()
        this.fileStream?.close()
        this.fileStream = undefined
        console.log(`pause:${this.task.state}`);

    }

    /**
     * 继续下载
     */
    public resume() {
        this.task.state = DownloadStatus.DOWNLOADING
        this.request?.abort()
        this.start()
    }




    // // 下载文件
    // public static downloadFile(url: string, dest: string, onProgress?: (downloadedSize: number, totalSize: number, speed: number) => void): Promise<void> {

    //     FileHandler.ensureDirectoryExistence(dest + '.downloaded')   // 创建文件

    //     const downloadedSoFar = parseInt(fs.readFileSync(dest + '.downloaded', { encoding: 'utf-8' }), 10) || 0;
    //     let startTime: number | undefined;

    //     return new Promise((resolve, reject) => {
    //         const request = https.get(url, { headers: { Range: `bytes=${downloadedSoFar}-` } }, response => {
    //             if (response.statusCode === 206) {
    //                 // Partial content received, continue downloading
    //             } else if (response.statusCode === 200) {
    //                 // Starting a new download
    //                 fs.writeFileSync(dest, '');
    //             } else {
    //                 reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
    //                 return;
    //             }

    //             const totalSize = downloadedSoFar + parseInt(response.headers['content-length'] ?? '0', 10);
    //             let downloadedSize = downloadedSoFar;

    //             const fileStream = fs.createWriteStream(dest, { flags: 'a' }); // Append mode
    //             response.pipe(fileStream);

    //             response.on('data', chunk => {
    //                 downloadedSize += chunk.length;

    //                 if (!startTime) {
    //                     startTime = Date.now();
    //                 }

    //                 const timeElapsed = Date.now() - startTime;
    //                 const speed = Math.round(downloadedSize / timeElapsed * 1000);

    //                 if (onProgress) {
    //                     onProgress((downloadedSize + downloadedSoFar), totalSize, speed);
    //                 }

    //                 fs.writeFileSync(dest + '.downloaded', (downloadedSize + downloadedSoFar).toString(), { encoding: 'utf-8' });
    //             });

    //             fileStream.on('finish', () => {
    //                 fileStream.close();
    //                 fs.unlinkSync(dest + '.downloaded');
    //                 resolve();
    //             });
    //         });

    //         request.on('error', err => {
    //             reject(err);
    //         });
    //     });
    // }
}