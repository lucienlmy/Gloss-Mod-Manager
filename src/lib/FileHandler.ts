/**
 * 文件相关操作
 */

import { documentDir, localDataDir, resourceDir } from "@tauri-apps/api/path";
import {
    copyFile as copyFileByFs,
    exists,
    lstat,
    mkdir,
    readDir,
    readFile as readBinaryFile,
    readTextFile,
    remove,
    rename,
    size,
    stat,
    writeFile as writeBinaryFile,
    writeTextFile,
} from "@tauri-apps/plugin-fs";
import { openPath } from "@tauri-apps/plugin-opener";
import { ElMessage } from "element-plus-message";
import { md5 } from "js-md5";

type BinaryLike = Uint8Array | ArrayBuffer;

export class FileHandler {
    private static readonly pathSeparator = "/";

    /**
     * 统一路径分隔符，避免旧工程里混用 \ 和 /。
     */
    public static normalizePath(filePath: string) {
        return filePath.replace(/[\\/]+/gu, FileHandler.pathSeparator);
    }

    private static splitRoot(filePath: string) {
        const normalizedPath = FileHandler.normalizePath(filePath.trim());

        if (!normalizedPath) {
            return {
                root: "",
                segments: [] as string[],
            };
        }

        let root = "";
        let rest = normalizedPath;
        const driveMatch = rest.match(/^[A-Za-z]:/u);

        if (driveMatch) {
            root = driveMatch[0];
            rest = rest.slice(root.length);
        }

        if (rest.startsWith(FileHandler.pathSeparator)) {
            root = `${root}${FileHandler.pathSeparator}`;
            rest = rest.replace(/^\/+/, "");
        }

        return {
            root,
            segments: rest
                .split(FileHandler.pathSeparator)
                .filter((segment) => segment !== ""),
        };
    }

    private static trimLeadingSeparators(filePath: string) {
        return filePath.replace(/^[/\\]+/u, "");
    }

    private static toUint8Array(data: BinaryLike | string) {
        if (typeof data === "string") {
            return new TextEncoder().encode(data);
        }

        if (data instanceof Uint8Array) {
            return data;
        }

        return new Uint8Array(data);
    }

    private static async ensureParentDirectory(filePath: string) {
        const parentDirectory = FileHandler.dirname(filePath);

        if (parentDirectory) {
            await FileHandler.createDirectory(parentDirectory);
        }
    }

    private static async isFile(filePath: string) {
        try {
            return (await stat(filePath)).isFile;
        } catch {
            return false;
        }
    }

    /**
     * 同步拼接路径字符串，并自动归一化 . / .. 片段。
     */
    public static joinPath(...paths: Array<string | null | undefined>) {
        let root = "";
        const segments: string[] = [];

        for (const item of paths) {
            if (!item) {
                continue;
            }

            const { root: nextRoot, segments: nextSegments } =
                FileHandler.splitRoot(String(item));

            if (nextRoot) {
                root = nextRoot;
                segments.length = 0;
            }

            for (const segment of nextSegments) {
                if (segment === ".") {
                    continue;
                }

                if (segment === "..") {
                    if (
                        segments.length > 0 &&
                        segments[segments.length - 1] !== ".."
                    ) {
                        segments.pop();
                    } else if (!root) {
                        segments.push(segment);
                    }
                    continue;
                }

                segments.push(segment);
            }
        }

        const joinedSegments = segments.join(FileHandler.pathSeparator);

        if (!root) {
            return joinedSegments;
        }

        if (!joinedSegments) {
            return root;
        }

        return root.endsWith(FileHandler.pathSeparator)
            ? `${root}${joinedSegments}`
            : `${root}${FileHandler.pathSeparator}${joinedSegments}`;
    }

    /**
     * 返回路径的父级目录。
     */
    public static dirname(filePath: string) {
        const { root, segments } = FileHandler.splitRoot(filePath);

        if (segments.length <= 1) {
            return root;
        }

        return FileHandler.joinPath(root, ...segments.slice(0, -1));
    }

    /**
     * 返回路径最后一段。
     */
    public static basename(filePath: string) {
        const normalizedPath = FileHandler.normalizePath(filePath).replace(
            /\/+$/u,
            "",
        );
        const parts = normalizedPath
            .split(FileHandler.pathSeparator)
            .filter((segment) => segment !== "");

        return parts.length > 0 ? parts[parts.length - 1] : "";
    }

    /**
     * 返回文件扩展名。
     */
    public static extname(filePath: string) {
        const fileName = FileHandler.basename(filePath);
        const dotIndex = fileName.lastIndexOf(".");

        if (dotIndex <= 0) {
            return "";
        }

        return fileName.slice(dotIndex);
    }

    /**
     * 计算 target 相对于 base 的相对路径。
     */
    public static relativePath(basePath: string, targetPath: string) {
        const normalizedBase = FileHandler.joinPath(basePath);
        const normalizedTarget = FileHandler.joinPath(targetPath);

        if (!normalizedBase) {
            return FileHandler.trimLeadingSeparators(normalizedTarget);
        }

        if (normalizedBase === normalizedTarget) {
            return "";
        }

        const prefix = normalizedBase.endsWith(FileHandler.pathSeparator)
            ? normalizedBase
            : `${normalizedBase}${FileHandler.pathSeparator}`;

        if (normalizedTarget.startsWith(prefix)) {
            return FileHandler.trimLeadingSeparators(
                normalizedTarget.slice(prefix.length),
            );
        }

        return FileHandler.trimLeadingSeparators(normalizedTarget);
    }

    /**
     * 判断文件是否存在
     * @param filePath
     * @returns
     */
    public static async fileExists(filePath: string): Promise<boolean> {
        try {
            return await exists(filePath);
        } catch {
            return false;
        }
    }

    /**
     * 递归创建目录
     * @param dirPath 目录路径
     */
    public static async createDirectory(dirPath: string) {
        if (!dirPath) {
            return;
        }

        await mkdir(dirPath, { recursive: true });
    }

    /**
     * 创建文件
     * @param filePath 文件路径
     */
    public static async ensureDirectoryExistence(
        filePath: string,
        defaultValue: string = "",
    ) {
        await FileHandler.ensureParentDirectory(filePath);

        if (!(await FileHandler.fileExists(filePath))) {
            await writeTextFile(filePath, defaultValue);
        }
    }

    /**
     * 复制文件
     * @param source 原文件
     * @param target 目标文件
     * @returns
     */
    public static async copyFile(source: string, target: string) {
        try {
            await FileHandler.ensureParentDirectory(target);

            if (await FileHandler.fileExists(target)) {
                const backFile = `${target}.gmmback`;
                await FileHandler.copyFile(target, backFile);
            }

            await copyFileByFs(source, target);
            return true;
        } catch (error) {
            ElMessage.error(`复制文件失败：${error}`);
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    /**
     * 复制文件夹
     * @param srcPath 原文件夹
     * @param target 目标文件夹
     */
    public static async copyFolder(srcPath: string, target: string) {
        try {
            await FileHandler.createDirectory(target);
            const entries = await readDir(srcPath);

            for (const entry of entries) {
                const sourcePath = FileHandler.joinPath(srcPath, entry.name);
                const targetPath = FileHandler.joinPath(target, entry.name);

                if (entry.isDirectory) {
                    await FileHandler.copyFolder(sourcePath, targetPath);
                } else if (entry.isFile) {
                    await FileHandler.copyFile(sourcePath, targetPath);
                }
            }

            return true;
        } catch (error) {
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    // 移动文件
    public static async moveFile(srcPath: string, destPath: string) {
        try {
            await FileHandler.ensureParentDirectory(destPath);
            await rename(srcPath, destPath);
            return true;
        } catch (error) {
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    /**
     * 移动文件夹
     * @param srcPath 原文件夹
     * @param destPath 目标文件夹
     * @returns
     */
    public static async moveFolder(srcPath: string, destPath: string) {
        try {
            await FileHandler.ensureParentDirectory(destPath);
            await rename(srcPath, destPath);
            return true;
        } catch (error) {
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    /**
     * 删除文件夹
     * @param folderPath 文件夹路径
     * @returns
     */
    public static async deleteFolder(folderPath: string): Promise<boolean> {
        try {
            if (!(await FileHandler.fileExists(folderPath))) {
                return true;
            }

            await remove(folderPath, { recursive: true });
            return true;
        } catch (error) {
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    /**
     * 删除文件
     * @param filePath 文件路径
     * @returns
     */
    public static async deleteFile(filePath: string) {
        try {
            if (await FileHandler.fileExists(filePath)) {
                await remove(filePath);
                const backFile = `${filePath}.gmmback`;

                if (await FileHandler.fileExists(backFile)) {
                    await FileHandler.renameFile(backFile, filePath);
                }
            }

            return true;
        } catch (error) {
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    /**
     * 读取文件 异步
     * @param filePath 文件路径
     * @param defaultValue 若文件不存在时的创建文件的默认值
     * @returns
     */
    public static async readFileSync(
        filePath: string,
        defaultValue: string = "",
    ): Promise<string> {
        await FileHandler.ensureDirectoryExistence(filePath, defaultValue);
        return readTextFile(filePath);
    }

    /**
     * 读取文件
     * @param filePath
     * @returns
     */
    public static async readFile(filePath: string, defaultValue: string = "") {
        if (!(await FileHandler.fileExists(filePath))) {
            await FileHandler.ensureDirectoryExistence(filePath, defaultValue);
        }

        return readTextFile(filePath);
    }

    /**
     * 写入文件
     * @param filePath 文件路径
     * @param data 写入的数据
     * @returns
     */
    public static async writeFile(filePath: string, data: string | BinaryLike) {
        try {
            await FileHandler.ensureParentDirectory(filePath);

            if (typeof data === "string") {
                await writeTextFile(filePath, data);
            } else {
                await writeBinaryFile(filePath, FileHandler.toUint8Array(data));
            }

            return true;
        } catch (error) {
            ElMessage.error(`写入文件失败：${error}`);
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    /**
     * 写入日志
     * @param msg 日志内容
     * @param isErr 是否为错误日志
     * @returns
     */
    public static writeLog(msg: string, isErr: boolean = false) {
        if (isErr) {
            console.error(msg);
        } else {
            console.info(msg);
        }

        return true;
    }

    /**
     * 获取文件MD5
     * @param filePath 文件路径
     * @returns
     */
    public static async getFileMd5(filePath: string): Promise<string> {
        try {
            const data = await readBinaryFile(filePath);
            return md5(data);
        } catch (error) {
            ElMessage.error(`获取文件MD5失败:${error}`);
            throw error;
        }
    }

    /**
     * 获取文件夹MD5
     * @param folderPath 路径
     * @returns
     */
    public static async getFolderHMd5(folderPath: string) {
        const files = await FileHandler.getFolderFiles(folderPath, true, true);
        let combinedHash = "";

        for (const filePath of files.sort()) {
            if (await FileHandler.isFile(filePath)) {
                combinedHash += await FileHandler.getFileMd5(filePath);
            }
        }

        return md5(combinedHash);
    }

    /**
     * 打开文件夹
     * @param folderPath 打开文件夹
     */
    public static async openFolder(folderPath: string) {
        try {
            await openPath(folderPath);
            return true;
        } catch (error) {
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    /**
     * 打开文件
     * @param filePath 文件路径
     */
    public static async openFile(filePath: string) {
        try {
            await openPath(filePath);
            return true;
        } catch (error) {
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    /**
     * 重命名文件或目录
     * @param filePath 文件路径
     * @param newName 目标名称
     * @returns
     */
    public static async renameFile(filePath: string, newName: string) {
        try {
            await FileHandler.ensureParentDirectory(newName);
            await rename(filePath, newName);
            return true;
        } catch (error) {
            ElMessage.error(`错误: ${error}`);
            return false;
        }
    }

    /**
     * 获取文件大小
     * @param filePath 文件路径
     */
    public static async getFileSize(filePath: string) {
        return size(filePath);
    }

    /**
     * 获取文件夹下的所有文件
     * @param folder
     */
    public static async getAllFiles(folder: string) {
        return FileHandler.getAllFilesInFolder(folder, true, true);
    }

    /**
     * 运行程序
     * @param exe 程序路径
     */
    public static async runExe(exe: string, options: string[] = []) {
        if (options.length > 0) {
            ElMessage.warning(
                "Tauri 前端当前不支持带参数直接启动外部程序，将忽略参数。",
            );
        }

        return FileHandler.openFile(exe);
    }

    /**
     * 创建软连接
     * @param folderPath 文件夹路径
     * @param destPath 软链接路径
     * @returns
     */
    public static async createLink(
        folderPath: string,
        destPath: string,
        backup: boolean = false,
    ) {
        try {
            if (backup && (await FileHandler.fileExists(destPath))) {
                await FileHandler.renameFile(destPath, `${destPath}_back`);
            }

            // Tauri 前端没有通用的 symlink API，这里退化为复制目录/文件。
            if (await FileHandler.isDir(folderPath)) {
                return FileHandler.copyFolder(folderPath, destPath);
            }

            return FileHandler.copyFile(folderPath, destPath);
        } catch (error) {
            ElMessage.error(`创建软连接失败：${error}`);
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    // 判断路径是否是软链
    public static async isSymlink(filePath: string): Promise<boolean> {
        try {
            return (await lstat(filePath)).isSymlink;
        } catch {
            return false;
        }
    }

    /**
     * 移除软连接
     * @param linkPath 软连接路径
     * @returns
     */
    public static async removeLink(linkPath: string, backup: boolean = false) {
        try {
            if (await FileHandler.isDir(linkPath)) {
                await FileHandler.deleteFolder(linkPath);
            } else {
                await FileHandler.deleteFile(linkPath);
            }

            if (backup) {
                const backFile = `${linkPath}_back`;
                if (await FileHandler.fileExists(backFile)) {
                    await FileHandler.renameFile(backFile, linkPath);
                }
            }

            return true;
        } catch (error) {
            ElMessage.error(`移除软连接失败：${error}`);
            FileHandler.writeLog(String(error), true);
            return false;
        }
    }

    /**
     * 将路径转换为数组
     * @param filePath 路径
     * @returns
     */
    public static pathToArray(filePath: string) {
        return FileHandler.normalizePath(filePath)
            .split(FileHandler.pathSeparator)
            .filter((item) => item !== "");
    }

    /**
     * 获取文件夹中的文件列表
     * @param folderPath 路径
     * @returns
     */
    public static async getFolderFiles(
        folderPath: string,
        includepath?: boolean,
        child: boolean = false,
    ) {
        return FileHandler.getAllFilesInFolder(folderPath, includepath, child);
    }

    /**
     * 从指定路径中获取指定文件夹后的目录
     * @param folderPath 路径
     * @param folderName 查找的文件夹名
     * @param include 是否包含查找的文件夹
     * @returns
     */
    public static getFolderFromPath(
        folderPath: string,
        folderName: string,
        include = false,
    ): string | null {
        const folders = FileHandler.pathToArray(folderPath);
        const index = folders.findIndex(
            (item) => item.toLowerCase() === folderName.toLowerCase(),
        );

        if (index === -1) {
            return null;
        }

        const startIndex = include ? index : index + 1;
        return folders.slice(startIndex).join(FileHandler.pathSeparator);
    }

    // 获取程序目录下的 resources 目录
    public static async getResourcesPath() {
        return FileHandler.normalizePath(await resourceDir());
    }

    /**
     * 获取我的文档路径
     * @returns
     */
    public static async getMyDocuments() {
        return FileHandler.normalizePath(await documentDir());
    }

    /**
     * 获取公共父文件夹
     * @param paths  文件列表
     * @returns
     */
    public static getCommonParentFolder(paths: string[]): string {
        if (paths.length === 0) {
            return "";
        }

        const dirs = paths.map((item) => FileHandler.pathToArray(item));

        if (dirs.some((item) => item.length === 0)) {
            return "";
        }

        const commonSegments: string[] = [];

        for (let index = 0; index < dirs[0].length; index += 1) {
            const current = dirs[0][index];

            if (dirs.some((item) => item[index] !== current)) {
                break;
            }

            commonSegments.push(current);
        }

        return commonSegments.join(FileHandler.pathSeparator);
    }

    /**
     * 获取路径下所有的文件
     * @param folderPath 路径
     * @param includepath 是否包含路径 false
     * @param subdirectory 是否包含子文件夹 false
     * @param getFolder 是否获取文件夹路径 false
     * @returns
     */
    public static async getAllFilesInFolder(
        folderPath: string,
        includepath: boolean = false,
        subdirectory: boolean = false,
        getFolder = false,
    ) {
        if (!(await FileHandler.fileExists(folderPath))) {
            return [] as string[];
        }

        let result: string[] = [];
        const entries = await readDir(folderPath);

        for (const entry of entries) {
            const entryPath = FileHandler.joinPath(folderPath, entry.name);

            if (entry.isFile) {
                result.push(includepath ? entryPath : entry.name);
                continue;
            }

            if (entry.isDirectory) {
                if (getFolder) {
                    result.push(entryPath);
                }

                if (subdirectory) {
                    result = result.concat(
                        await FileHandler.getAllFilesInFolder(
                            entryPath,
                            includepath,
                            subdirectory,
                            getFolder,
                        ),
                    );
                }
            }
        }

        return result;
    }

    /**
     * 获取路径下所有文件夹
     * @param folderPath 路径
     * @param subdirectory 是否递归获取子目录
     * @returns
     */
    public static async getAllFolderInFolder(
        folderPath: string,
        subdirectory: boolean = false,
    ) {
        if (!(await FileHandler.fileExists(folderPath))) {
            return [] as string[];
        }

        let result: string[] = [];
        const entries = await readDir(folderPath);

        for (const entry of entries) {
            if (!entry.isDirectory) {
                continue;
            }

            const entryPath = FileHandler.joinPath(folderPath, entry.name);
            result.push(entryPath);

            if (subdirectory) {
                result = result.concat(
                    await FileHandler.getAllFolderInFolder(entryPath, true),
                );
            }
        }

        return result;
    }

    // 判断程序是否已经启动
    public static async existsSync(_name: string) {
        console.warn("Tauri 前端当前不支持直接枚举系统进程。");
        return false;
    }

    /**
     * 判断是否是文件夹
     * @param filePath 路径
     * @returns
     */
    public static async isDir(filePath: string) {
        try {
            return (await stat(filePath)).isDirectory;
        } catch {
            return false;
        }
    }

    /**
     * 比较两个文件名是否相同
     * @param name1
     * @param name2
     * @returns
     */
    public static compareFileName(name1: string, name2: string) {
        return (
            FileHandler.basename(name1).toLowerCase() ===
            FileHandler.basename(name2).toLowerCase()
        );
    }

    /**
     * 获取 appdata 路径
     * @returns 返回 C:/Users/[用户名]/AppData
     */
    public static async GetAppData() {
        return FileHandler.dirname(
            FileHandler.normalizePath(await localDataDir()),
        );
    }
}
