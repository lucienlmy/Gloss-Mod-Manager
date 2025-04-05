import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { dialog } from 'electron'
// import { path7za } from '7z-win'
import AutoLaunch from 'auto-launch'
import { existsSync } from 'fs'
import { autoUpdater } from "electron-updater"
import logger from "electron-log"
import Store from 'electron-store'
import { fileURLToPath } from 'node:url'

import { GetData } from './model/GetData'
import { Config } from './model/Config'

logger.initialize()

autoUpdater.logger = logger

// const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = join(__dirname, '..')
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// process.env.DIST_ELECTRON = join(__dirname, '..')
// process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
// process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
//     ? join(process.env.DIST_ELECTRON, '../public')
//     : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

// 分配最大内存
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// 禁用安全策略
app.commandLine.appendSwitch('disable-features', 'BlockInsecurePrivateNetworkRequests')



// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, './preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(RENDERER_DIST, 'index.html')

const store = new Store()

let isDev = (() => {
    return process.env.NODE_ENV === 'development' || (existsSync(join(dirname(app.getPath('exe')), 'DEV')))
})()

async function createWindow() {
    let width = store.get('window.width', 1280) as number
    let height = store.get('window.height', 720) as number
    let x = store.get('window.x', undefined) as number
    let y = store.get('window.y', undefined) as number

    console.log(width, height, x, y);


    // 判断环境是否是开发环境 或调试环境
    // if (isDev) {
    //     width += 550
    // }

    win = new BrowserWindow({
        title: 'Gloss Mod Manager',
        icon: join(process.env.PUBLIC || '', 'favicon.ico'),
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
        minWidth: 1280,
        minHeight: 720,
        width, height, x, y,
        frame: false,
    })

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
        if (url) win.loadURL(url)
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
    }

    // 在生成环境打开开发者工具
    if (isDev) {
        win.webContents.openDevTools()  // 打开Dev工具
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    if (!isDev) {
        win.webContents.on('will-navigate', (event, url) => {
            event.preventDefault()
            shell.openExternal(url)
        })
    }

    // Make all links open with the browser, not with the application
    // 新窗口打开链接
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return { action: 'deny' }
    })

    if (process.defaultApp) {
        if (process.argv.length >= 1) {
            app.setAsDefaultProtocolClient('gmm', process.execPath, [resolve(process.argv[1])])
            app.setAsDefaultProtocolClient('nxm', process.execPath, [resolve(process.argv[1])])
        }
    } else {
        app.setAsDefaultProtocolClient('gmm')
        app.setAsDefaultProtocolClient('nxm')
    }


    // 稍微等待一下渲染进程
    setTimeout(() => {
        app.emit("second-instance", null, process.argv);
    }, 3000)

    win.on('close', () => {
        const bounds = win?.getBounds()
        if (bounds) {
            console.log(bounds.width, bounds.height, bounds.x, bounds.y);
            store.set('window.width', bounds.width)
            store.set('window.height', bounds.height)
            store.set('window.x', bounds.x)
            store.set('window.y', bounds.y)
        }
    })
}

app.whenReady().then(createWindow)

//#region 窗口相关

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', (event, argv) => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
    win?.webContents.send('open-gmm-file', argv)
})


app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})


// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
        },
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        childWindow.loadURL(`${url}#${arg}`)
    } else {
        childWindow.loadFile(indexHtml, { hash: arg })
    }
})

// 窗口最小化
ipcMain.on('window-min', function () {
    if (win) {
        win.minimize();
    }
})
//窗口最大化
ipcMain.on('window-max', function () {
    if (win) {
        if (win.isMaximized()) {
            win.restore();
        } else {
            win.maximize();
        }
    }
})
//关闭窗口
ipcMain.on('window-close', function () {
    if (win) {
        win.close();
    }
})

//#endregion


//#region 3DM Mod

// 获取Mod列表数据
ipcMain.handle('get-mod-list', async (event, arg) => {
    let data = {
        page: arg.page ?? 1,
        pageSize: arg.pageSize ?? 24,
        title: arg.title ?? '',
        original: arg.original ?? 0,
        time: arg.time ?? 0,
        order: arg.order ?? 0,
        key: arg.key ?? '',
        gameId: arg.gameId ?? null,
        gameType: arg.gameType ?? 0,
        show_adult: arg.show_adult ?? null,
        show_charge: arg.show_charge ?? null,
    }

    return await GetData.getModList(data)
})

// 获取Mod数据
ipcMain.handle('get-mod-data', async (event, arg) => {
    let id = arg.id;
    let res = await GetData.getMod(id)
    return res.data
})

// 获取游戏类型
ipcMain.handle('get-types', async (event, arg) => {
    let gameId = arg.gameId;
    let res = await GetData.getTypes(gameId)
    return res.data
})


// 用户登录
ipcMain.handle('user-login', async (event, arg) => {
    let res = await GetData.login(arg.username, arg.password)
    return res
})

// 获取收藏列表
ipcMain.handle('get-favorite-list', async (event, arg) => {
    return await GetData.getFavoriteList(arg)
})

//#endregion

//#region 更新相关

// 检查Mod更新
ipcMain.handle('check-mod-update', async (event, arg) => {
    let res = await GetData.checkAllModUpdate(arg)
    return res
})

// 自动更新
ipcMain.handle('check-for-updates', (event, arg) => {
    autoUpdater.checkForUpdates();
})
// 安装并重启
ipcMain.handle('install-update-and-restart', (event, arg) => {
    // autoUpdater.quitAndInstall();
    autoUpdater.quitAndInstall(false)
})

autoUpdater.on('checking-for-update', () => {
    win?.webContents.send('checking-for-update')
})
autoUpdater.on('update-available', (info) => {
    win?.webContents.send('update-available', info);
})
autoUpdater.on('update-not-available', (info) => {
    win?.webContents.send('update-not-available', info);
})
autoUpdater.on('error', (err) => {
    win?.webContents.send('update-error', err);
})
autoUpdater.on('download-progress', (progressObj) => {
    win?.webContents.send("download-progress", progressObj);
})
autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send('update-downloaded', info);
});

//#endregion

//#region 其他

// 选择文件
ipcMain.handle('select-file', async (event, arg) => {
    const result = await dialog.showOpenDialog({
        ...arg
    })
    return result.filePaths
})

ipcMain.handle('save-file', async (event, arg) => {
    const result = await dialog.showSaveDialog({
        ...arg
    })
    return result.filePath
})

// 获取系统目录
ipcMain.handle('get-system-path', async (event, arg) => {
    return app.getPath(arg);
})

// 获取版本
ipcMain.handle('get-version', async (event, arg) => {
    let localVersion = app.getVersion()
    let modData = await GetData.getMod(197445)
    return [localVersion, modData.data]
})

// 获取Config
ipcMain.handle('get-config', async (event, arg) => {
    return Config.Api
})

// 设置在开机自启
ipcMain.handle('set-auto-launch', async (event, arg) => {
    let autoLaunch = new AutoLaunch({
        name: 'Gloss Mod Manager',
        path: app.getPath('exe'),
    })
    if (arg) {
        autoLaunch.enable()
    } else {
        autoLaunch.disable()
    }
    console.log(`Auto Launch:${arg}`);
})



ipcMain.on('open-gmm-file', (event, arg) => {
    console.log(arg);

    win?.webContents.send('open-gmm-file', arg)
})

// 获取系统语言
ipcMain.handle('get-system-language', async (event, arg) => {
    let locale = app.getLocale()
    // 将 - 替换为 _
    locale = locale.replace('-', '_')
    return locale
})

// 获取程序目录
ipcMain.handle('get-app-path', async (event, arg) => {
    let mainpath = isDev ? process.env.APP_ROOT : dirname(app.getPath('exe'))
    return mainpath
})

//#endregion