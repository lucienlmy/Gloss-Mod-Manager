/**
 * 文件相关操作
 */

import * as fs from 'fs';
// import fs from 'fs/promises';
import * as path from 'path';
import { homedir } from "os";
import { Config } from "@src/model/Config";
import { createHash } from 'crypto';
import { ElMessage } from 'element-plus';
import { exec } from 'child_process';


export class FileHandler {

    public static logFile = () => path.join(Config.configFolder(), 'log.txt')

    /**
     * 判断文件是否存在
     * @param filePath 
     * @returns 
     */
    public static fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }


    /**
     * 递归创建目录
     * @param dirPath 目录路径
     */
    public static createDirectory(dirPath: string) {
        if (!this.fileExists(dirPath)) {
            this.createDirectory(path.dirname(dirPath));
            fs.mkdirSync(dirPath);
        }
    }

    /**
     * 创建文件
     * @param filePath 文件路径
     */
    public static async ensureDirectoryExistence(filePath: string, defaultValue: string = '') {
        this.createDirectory(path.dirname(filePath));
        if (!this.fileExists(filePath)) {
            fs.writeFileSync(filePath, defaultValue);
        }

    }

    /**
     * 复制文件
     * @param source 原文件 
     * @param target 目标文件
     * @returns 
     */
    public static copyFile(source: string, target: string): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                this.createDirectory(path.dirname(target));

                // 判断文件是否存在 如果存在则备份文件 名称为 *.gmmback
                if (this.fileExists(target)) {
                    console.log(`${target} 文件存在, 进行备份`);
                    let backFile = target + '.gmmback'
                    await this.copyFile(target, backFile)
                }
                fs.copyFileSync(source, target);
                resolve(true)
            } catch (err) {
                ElMessage.error(`复制文件失败：${err}`)
                this.writeLog(err as string)
                reject(false)
            }
        })
    }

    /**
     * 复制文件夹
     * @param srcPath 原文件夹
     * @param target 目标文件夹
     */
    public static copyFolder(srcPath: string, target: string) {
        return new Promise<boolean>((resolve, reject) => {
            try {
                // 获取源文件夹内所有的文件和子文件夹
                const files = fs.readdirSync(srcPath);
                // 遍历子文件和子文件夹
                files.forEach(async file => {
                    // 源文件/文件夹的完整路径
                    const srcFilePath = path.join(srcPath, file);
                    // 目标文件/文件夹的完整路径
                    const destFilePath = path.join(target, file);
                    // 如果是文件夹，则递归调用该文件夹下的所有文件和文件夹
                    if (fs.statSync(srcFilePath).isDirectory()) {
                        this.createDirectory(destFilePath);
                        await this.copyFolder(srcFilePath, destFilePath);
                    } else {
                        // 复制文件
                        await this.copyFile(srcFilePath, destFilePath)
                    }
                });
                resolve(true)
            } catch (error) {
                this.writeLog(`${error}`)
                reject(false)
            }
        })
    }


    // 移动文件
    public static moveFile(srcPath: string, destPath: string) {
        return new Promise<boolean>((resolve, reject) => {
            try {
                this.createDirectory(path.dirname(destPath));
                fs.renameSync(srcPath, destPath)
                resolve(true)
            } catch (error) {
                this.writeLog(`${error}`)
                reject(false)
            }
        })
    }

    /**
     * 移动文件夹
     * @param srcPath 原文件夹
     * @param destPath 目标文件夹
     * @returns 
     */
    public static moveFolder(srcPath: string, destPath: string) {
        return new Promise<boolean>((resolve, reject) => {
            try {
                this.getAllFiles(srcPath).forEach(async file => {
                    let dest = file.replace(srcPath, destPath)
                    await this.moveFile(file, dest)
                })
                this.deleteFolder(srcPath)
                resolve(true)
            } catch (error) {
                this.writeLog(`${error}`)
                reject(false)
            }
        })
    }

    /**
     * 删除文件夹
     * @param folderPath 文件夹路径
     * @returns 
     */
    public static deleteFolder(folderPath: string): boolean {
        try {
            const files = fs.readdirSync(folderPath);
            // 删除每个文件和子目录
            files.forEach(file => {
                const filePath = path.join(folderPath, file);
                // 如果是子目录，递归调用自身
                if (fs.lstatSync(filePath).isDirectory()) {
                    this.deleteFolder(filePath);
                } else { // 否则直接删除文件
                    this.deleteFile(filePath);
                }
            });
            // 删除空目录
            fs.rmdirSync(folderPath);
            return true
        } catch (err) {
            this.writeLog(err as string)
            return false
        }

    }

    /**
     * 删除文件
     * @param filePath 文件路径
     * @returns 
     */
    public static deleteFile(filePath: string) {
        try {
            if (this.fileExists(filePath)) {
                fs.unlinkSync(filePath);
                // 判断是否有备份文件
                let backFile = filePath + '.gmmback'
                if (this.fileExists(backFile)) {
                    console.log(`${filePath} 存在备份，进行还原`);
                    this.renameFile(backFile, filePath)
                }
            }
            return true
        } catch (err) {
            ElMessage.error(`删除文件失败：${err}`)
            this.writeLog(err as string)
            return false
        }
    }

    /**
     * 读取文件 异步
     * @param filePath 文件路径
     * @param defaultValue 若文件不存在时的创建文件的默认值
     * @returns 
     */
    public static async readFileSync(filePath: string, defaultValue: string = ''): Promise<string> {
        await this.ensureDirectoryExistence(filePath, defaultValue)

        let data = fs.readFileSync(filePath, 'utf-8')
        return data
    }

    /**
     * 读取文件 同步
     * @param filePath 
     * @returns 
     */
    public static readFile(filePath: string) {
        if (this.fileExists(filePath)) {
            let data = fs.readFileSync(filePath, 'utf-8')
            return data
        } else {
            return null
        }
    }

    /**
     * 写入文件
     * @param filePath 文件路径
     * @param data 写入的数据
     * @returns 
     */
    public static writeFile(filePath: string, data: string | Buffer): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.createDirectory(path.dirname(filePath));

                // 判断文件是否存在
                if (!this.fileExists(filePath)) {
                    fs.writeFileSync(filePath, data);
                    resolve(true)
                    return
                }

                fs.writeFileSync(filePath, data);
                resolve(true)
            } catch (err) {
                ElMessage.error(`写入文件失败：${err}`)
                reject(err)
            }
        })
    }

    /**
     * 写入日志
     * @param msg 日志内容
     * @param isErr 是否为错误日志
     * @returns 
     */
    public static writeLog(msg: string, isErr: boolean = false): boolean {
        try {
            // console.log(this.logFile);
            this.createDirectory(path.dirname(this.logFile()));
            let time = new Date().toLocaleString();
            let log = `[${time}]: ${msg}\n`
            console.log(log);
            fs.appendFileSync(this.logFile(), log);

            if (isErr) {
                ElMessage.error(log)
            }

            return true
        } catch (err) {
            console.log(err);
            return false
        }
    }

    /**
     * 获取文件MD5
     * @param filePath 文件路径
     * @returns 
     */
    public static getFileMd5(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = createHash('md5');
            const stream = fs.createReadStream(filePath);
            stream.on('data', (chunk) => {
                hash.update(chunk);
            });
            stream.on('end', () => {
                const md5 = hash.digest('hex');
                resolve(md5);
            });
            stream.on('error', (err) => {
                ElMessage.error(`获取文件MD5失败:${err}`)
                reject(err);
            });
        });
    }

    /**
     * 打开文件夹
     * @param folderPath 打开文件夹
     */
    public static openFolder(folderPath: string) {
        exec(`explorer "${folderPath}"`);
    }

    /**
     * 打开文件
     * @param filePath 文件路径
     */
    public static openFile(filePath: string) {
        console.log(filePath);

        exec(`open "${filePath}"`)
    }

    /**
     * 重命名文件
     * @param filePath 文件路径
     * @param newName 目标名称
     * @returns 
     */
    public static renameFile(filePath: string, newName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                fs.renameSync(filePath, newName)
                resolve()
            } catch (error) {
                ElMessage.error(`错误: ${error}`)
                reject(error)
            }

        })
    }

    /**
     * 获取文件大小
     * @param filePath 文件路径
     */
    public static async getFileSize(filePath: string) {
        const fileStat = await fs.promises.stat(filePath);
        if (fileStat.isFile()) {
            return fileStat.size;
        } else if (fileStat.isDirectory()) {
            let size = 0;
            const files = await fs.promises.readdir(filePath);
            for (let i = 0; i < files.length; i++) {
                size += await this.getFileSize(path.join(filePath, files[i]));
            }
            return size;
        }
        return 0
    }

    /**
     * 获取文件夹下的所有文件
     * @param folder 
     */
    public static getAllFiles(folder: string) {
        let res: string[] = [];
        const files = fs.readdirSync(folder);
        files.forEach((file) => {
            const filePath = path.join(folder, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
                res.push(filePath);
            } else if (stat.isDirectory()) {
                res = res.concat(this.getAllFiles(filePath));
            }
        });
        return res;
    }

    /**
     * 运行程序
     * @param exe 程序路径
     */
    public static runExe(exe: string) {
        let { root, dir: folder, base: name } = path.parse(exe)
        // 去除 root 中的 \
        root = root.replace(/\\/g, '')

        let cmd = `${root} && cd "${folder}" && "${name}" `;
        console.log(cmd);
        exec(cmd)
    }

    /**
     * 创建软连接
     * @param folderPath 文件夹路径
     * @param destPath 软链接路径
     * @returns 
     */
    public static createLink(folderPath: string, destPath: string) {
        // symlinkSync
        try {
            this.createDirectory(path.join(destPath, '..'))
            fs.symlinkSync(folderPath, destPath, 'junction');
            return true
        } catch (error) {
            ElMessage.error(`创建软连接失败：${error}`)
            this.writeLog(error as string)
            return false
        }
    }

    // 判断路径是否是软链
    public static isSymlink(path: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            fs.lstat(path, (err, stats) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stats.isSymbolicLink());
                }
            });
        });
    }


    /**
     * 移除软连接
     * @param linkPath 软连接路径
     * @returns 
     */
    public static removeLink(linkPath: string) {
        try {
            // this.createDirectory(path.join(linkPath, '..'))
            fs.unlinkSync(linkPath)
            return true
        } catch (error) {
            ElMessage.error(`移除软连接失败：${error}`)
            this.writeLog(error as string)
            return false
        }
    }

    /**
     * 将路径转换为数组
     * @param filePath 路径
     * @returns 
     */
    public static pathToArray(filePath: string) {
        return filePath.split(path.sep)
    }

    /**
     * 获取文件夹中的文件列表
     * @param folderPath 路径
     * @returns 
     */
    public static getFolderFiles(folderPath: string) {

        // 判断目录是否存在
        if (this.fileExists(folderPath)) {
            return fs.readdirSync(folderPath)
        }
        return []
    }

    /**
     * 从指定路径中获取指定文件夹后的目录
     * @param folderPath 路径
     * @param folderName 查找的文件夹名
     * @param include 是否包含查找的文件夹
     * @returns 
     */
    public static getFolderFromPath(folderPath: string, folderName: string, include = false): string | null {
        let folders = this.pathToArray(folderPath)
        // 不区分大小写
        let index = folders.findIndex(item => item.toLowerCase() == folderName.toLowerCase())
        if (index === -1) {
            return null
        }
        if (include) {
            return folders.slice(index).join(path.sep)
        } else {
            return folders.slice(index + 1).join(path.sep)
        }
    }

    // 获取程序目录下的 resources 目录
    public static getResourcesPath() {
        return path.join(process.cwd(), 'resources')
    }

    /**
     * 获取我的文档路径
     * @returns 
     */
    public static async getMyDocuments() {

        let documents = path.join(homedir(), 'My Documents')
        if (this.fileExists(documents)) return documents     // 如果能直接找到则直接返回

        const edge = require('electron-edge-js')
        let assemblyFile = path.join(this.getResourcesPath(), "dll", "GetSpecialFolder.dll")
        let Invoke = edge.func({
            assemblyFile: assemblyFile,
            typeName: 'GetSpecialFolder.Program',
            methodName: 'GetMyDocuments'
        })
        return new Promise<string>((resolve, reject) => {
            Invoke(null, async (error: any, result: any) => {
                if (error) reject(error);
                console.log(result);
                resolve(result);
            })
        })
    }

    /**
     * 获取公共父文件夹
     * @param paths  文件列表
     * @returns 
     */
    public static getCommonParentFolder(paths: string[]): string {

        /// AI 给的写法 虽然看不懂 但感觉很酷
        const dirs = paths.map((p) => p.split(path.sep));
        if (dirs.some((d) => d.length === 0)) return "";
        for (let i = 0; i < dirs[0].length; i++) {
            const current = dirs[0][i];
            if (dirs.some((d) => d[i] !== current)) {
                return dirs[0].slice(0, i).join(path.sep);
            }
        }
        return dirs[0].join(path.sep);
    }

    // 获取路径下所有的文件
    public static getAllFilesInFolder(folderPath: string) {
        let files: string[] = []
        if (this.fileExists(folderPath)) {
            files = fs.readdirSync(folderPath)
        }
        return files
    }

    // 判断程序是否已经启动
    public static async existsSync(name: string) {

        return new Promise<boolean>((resolve, reject) => {
            try {
                let cmd = `tasklist | findstr ${path.basename(name)}`
                exec(cmd, (err, stdout, stderr) => {
                    console.log(stdout);
                    if (stdout != '') {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                });
            } catch (error) {
                reject(error)
            }

        })
    }
}
