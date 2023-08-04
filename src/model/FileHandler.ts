/**
 * 文件相关操作
 */

import * as fs from 'fs';
// import fs from 'fs/promises';
import * as path from 'path';
import { homedir } from "os";
import { createHash } from 'crypto';
import { ElMessage } from 'element-plus';
import { exec } from 'child_process';


export class FileHandler {

    public static logFile = path.join(homedir(), 'My Documents', 'Gloss Mod Manager', 'log.txt')

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
     * @param src 原文件 
     * @param dest 目标文件
     * @returns 
     */
    public static copyFile(src: string, dest: string): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                this.createDirectory(path.dirname(dest));
                fs.copyFileSync(src, dest);
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
     * @param destPath 目标文件夹
     */
    public static copyFolder(srcPath: string, destPath: string) {
        return new Promise<boolean>((resolve, reject) => {
            try {
                // 获取源文件夹内所有的文件和子文件夹
                const files = fs.readdirSync(srcPath);
                // 遍历子文件和子文件夹
                files.forEach(async file => {
                    // 源文件/文件夹的完整路径
                    const srcFilePath = path.join(srcPath, file);
                    // 目标文件/文件夹的完整路径
                    const destFilePath = path.join(destPath, file);
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
            this.createDirectory(path.dirname(this.logFile));
            let time = new Date().toLocaleString();
            let log = `${time}: ${msg}\n`
            console.log(log);
            fs.appendFileSync(this.logFile, log);

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
     */
    public static renameFile(filePath: string, newName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.rename(filePath, newName, (err) => {
                if (err) throw reject(err);
                resolve()
            })
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

    // 运行程序
    public static runExe(exe: string) {
        let { root, dir: folder, base: name } = path.parse(exe)
        // 去除 root 中的 \
        root = root.replace(/\\/g, '')

        let cmd = `${root} && cd "${folder}" && "${name}" `;
        console.log(cmd);
        exec(cmd)
    }

    // 创建软连接
    public static createLink(target: string, destPath: string) {
        // symlinkSync
        try {
            this.createDirectory(path.join(destPath, '..'))
            fs.symlinkSync(target, destPath, 'junction');
            return true
        } catch (error) {
            ElMessage.error(`创建软连接失败：${error}`)
            this.writeLog(error as string)
            return false
        }
    }

    // 移除软连接
    public static removeLink(linkPath: string) {
        try {
            this.createDirectory(path.join(linkPath, '..'))
            fs.unlinkSync(linkPath)
            return true
        } catch (error) {
            ElMessage.error(`移除软连接失败：${error}`)
            this.writeLog(error as string)
            return false
        }
    }

    // 将路径转换为数组
    public static pathToArray(filePath: string) {
        return filePath.split(path.sep)
    }
}
