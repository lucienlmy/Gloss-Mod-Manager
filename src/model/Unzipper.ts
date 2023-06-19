/**
 * 解压文件
 */

import { extractFull, Data, add, rename } from 'node-7z'
import { ipcRenderer } from 'electron'
import { exec, execSync } from 'child_process';
import path from 'path'
import { FileHandler } from '@src/model/FileHandler'
import AdmZip from 'adm-zip'
import fs from 'fs'
import { useSettings } from '@src/stores/useSettings';

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
    public static unzip(source: string, target: string, cherryPick?: string[]): Promise<Data[]> {
        return new Promise(async (resolve, reject) => {
            let files: Data[] = []
            const myStream = extractFull(source, target, {
                $bin: await this.get7zip(),
                charset: 'utf-8',
                $cherryPick: cherryPick
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

    /**
     * 读取zip 中的文件
     * @param zipPath 
     * @param file 
     */
    public static async readZipFile(zipPath: string, file: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            const settings = useSettings()
            let target = path.join(settings.settings.modStorageLocation, 'temp')
            console.log(target);

            const myStream = extractFull(zipPath, target, {
                $bin: await this.get7zip(),
                charset: 'utf-8',
                $cherryPick: [file]
            })
            myStream.on('data', function (data) {
                console.log(data);

            })
            myStream.on('error', (err) => {
                reject(err)
            })
            myStream.on('end', function () {
                let data = FileHandler.readFile(path.join(target, file))
                resolve(data)
            })
        })
    }

    /**
     * 创建一个空的zip文件
     * @param zipPath 压缩包路径
     * @param info info.json的内容
     * @returns 
     */
    public static async createZip(zipPath: string, info: any) {
        return new Promise<void>(async (resolve, reject) => {

            FileHandler.deleteFile(zipPath)
            let infoPath = path.join(path.dirname(zipPath), 'info.json')
            await FileHandler.ensureDirectoryExistence(infoPath, JSON.stringify(info))
            const myStream = add(zipPath, infoPath, {
                $bin: await this.get7zip(),
                charset: 'utf-8',
                recursive: true,
            })

            myStream.on('data', function (data) {
                console.log(data);
            })
            myStream.on('error', (err) => {
                reject(err)
            })
            myStream.on('end', function () {
                resolve()
                FileHandler.deleteFile(infoPath)
            })

            // ===================================================================



        })
    }

    /**
     * 添加文件到压缩包
     * @param zipPath zip文件路径
     * @param fileList 文件列表
     * @returns 
     */
    public static async addFileToZip(zipPath: string, fileList: string[] | string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const myStream = add(zipPath, fileList, {
                $bin: await this.get7zip(),
                charset: 'utf-8',
                recursive: true,
            })

            myStream.on('data', function (data) {
                console.log(data);
            })
            myStream.on('error', (err) => {
                reject(err)
            })
            myStream.on('end', function () {
                resolve()
            })
        })
    }

    /**
     * 重命名文件
     * @param zipPath zip文件路径
     * @param name 重命名列表
     */
    public static async renameForZip(zipPath: string, name: string[][]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const myStream = rename(zipPath, name, {
                $bin: await this.get7zip(),
                charset: 'utf-8',
            })
            myStream.on('data', function (data) {
                console.log(data);
            })
            myStream.on('error', (err) => {
                reject(err)
            })
            myStream.on('end', function () {
                resolve()
            })
        })
    }

    /**
     * 添加并重命名文件
     * @param zipPath zip文件路径
     * @param filePath 文件路径
     * @param name 重命名
     */
    public static async addAndRenameToZip(zipPath: string, filePath: string, name: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let _7z = await this.get7zip()
            exec(`"${_7z}" a "${zipPath}" "${filePath}"`, (err, stdout, stderr) => {
                if (err) reject(err)
                if (stderr) reject(stderr)
                if (stdout) {
                    // resolve(stdout)
                    exec(`"${_7z}" rn "${zipPath}" "${path.basename(filePath)}" "${name}"`, (err, stdout, stderr) => {
                        if (err) reject(err)
                        if (stderr) reject(stderr)
                        if (stdout) {
                            // console.log(stdout)
                            resolve(stdout)
                        }
                    })
                }
            })

        })
    }

}