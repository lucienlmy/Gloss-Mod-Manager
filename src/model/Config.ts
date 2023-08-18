import { join, dirname } from 'node:path'
import { homedir } from "os";
import { readFileSync, writeFile, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { useSettings } from '@src/stores/useSettings'
import { ISettings } from './Interfaces';
import { useManager } from '@src/stores/useManager';
import { ipcRenderer } from 'electron';
import { FileHandler } from '@src/model/FileHandler'

export class Config {

    // 配置文件路径
    public static configFile() {

        let oldConfigFolder = join(join(homedir(), 'My Documents', 'Gloss Mod Manager'))
        let newConfigFolder = join("C:", 'Gloss Mod Manager')

        if (FileHandler.fileExists(oldConfigFolder)) {
            console.log('文件夹存在');
            // console.log(join("C:", 'Gloss Mod Manager'));
            // FileHandler.moveFolder(oldConfigFolder, newConfigFolder)
            FileHandler.copyFolder(oldConfigFolder, newConfigFolder)
            FileHandler.deleteFolder(oldConfigFolder)
        }


        const configPath = join(newConfigFolder, 'config.json')

        FileHandler.ensureDirectoryExistence(configPath, '{}')

        return configPath
    }

    // 读取配置文件
    public static getConfig(): ISettings {
        let config = readFileSync(this.configFile(), 'utf-8')
        let settings: ISettings = JSON.parse(config)

        return {
            modStorageLocation: settings.modStorageLocation,
            managerGame: settings.managerGame,
            proxy: settings.proxy,
            // UnzipPath: settings.UnzipPath,
            autoInstall: settings.autoInstall,
            leftMenuRail: settings.leftMenuRail,
            autoLaunch: settings.autoLaunch,
            language: settings.language,
            theme: settings.theme
        }
    }
    // 保存配置文件
    public static setConfig(data: ISettings) {
        let configPath = this.configFile()

        data = JSON.parse(JSON.stringify(data))
        console.log(data);

        // 格式化存入文件
        const config = JSON.stringify(data)
        writeFile(configPath, config, { encoding: 'utf-8', flag: 'w' }, function (err) {
            if (err) {
                console.log(err)
            }
        })
    }

    public static async initialization() {
        const settings = useSettings()
        const Manager = useManager()
        let data = this.getConfig()
        settings.settings = {
            managerGame: data.managerGame,
            modStorageLocation: data.modStorageLocation ?? join('C:', 'Gloss Mod Manager', 'mods'),
            proxy: data.proxy ?? "",
            // UnzipPath: data.UnzipPath ?? "",
            autoInstall: data.autoInstall ?? true,
            leftMenuRail: data.leftMenuRail ?? false,
            autoLaunch: data.autoLaunch ?? false,
            language: data.language ?? await ipcRenderer.invoke('get-system-language'),
            theme: data.theme ?? 'system'
        }

        // 初始化游戏
        if (settings.settings.managerGame?.gameName) {
            let gameID = settings.settings.managerGame?.gameID
            Manager.supportedGames.forEach(item => {
                if (item.gameID === gameID) {
                    settings.settings.managerGame = Object.assign({}, settings.settings.managerGame, item)
                    // console.log(settings.settings.managerGame);
                }
            })
        }

        // 初始化7-zip
        // if (settings.settings.UnzipPath == '') {
        //     let installPath = ''
        //     try {
        //         const output = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\7zFM.exe" /ve').toString();
        //         const match = output.match(/^(.*?)\s+REG_SZ\s+(.*)$/m);
        //         installPath = (match && match[2]) as string;
        //         installPath = join(dirname(installPath), '7z.exe');
        //         settings.settings.UnzipPath = installPath
        //         this.setConfig(settings.settings)
        //     } catch (err) {
        //         ElMessage.error('获取7-zip失败,可以没有安装,您可以手动选择')
        //         console.log(err);
        //     }
        // }
    }
}
