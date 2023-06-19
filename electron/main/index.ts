import { app, BrowserWindow, shell, ipcMain, ipcRenderer, } from 'electron'
import { release } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { dialog } from 'electron'
import { GetData } from '../model/GetData'
import { path7za } from '7z-win'
import AutoLaunch from 'auto-launch'
import { existsSync } from 'fs'


process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? join(process.env.DIST_ELECTRON, '../public')
    : process.env.DIST

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
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
    let width = 1280
    let height = 720

    // 判断环境是否是开发环境
    if (process.env.NODE_ENV === 'development') {
        width += 550
    }

    win = new BrowserWindow({
        title: 'GMM',
        icon: join(process.env.PUBLIC, 'favicon.ico'),
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            nodeIntegration: true,
            contextIsolation: false,
        },
        minWidth: width,
        minHeight: height,
        frame: false,
    })

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
        win.loadURL(url)
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
    }

    // 在生成环境打开开发者工具
    if (existsSync(join(dirname(app.getPath('exe')), 'DEV'))) {
        win.webContents.openDevTools()  // 打开Dev工具
    }



    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    win.webContents.on('will-navigate', (event, url) => {
        event.preventDefault()
        shell.openExternal(url)
    })
    // Make all links open with the browser, not with the application
    // 新窗口打开链接
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return { action: 'deny' }
    })

    // app.setAsDefaultProtocolClient('gmm', process.execPath, [resolve(process.argv[1])])

    app.setAsDefaultProtocolClient('gmm');

}

app.whenReady().then(createWindow)


app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})

app.on('second-instance', (event, argv) => {
    win.webContents.send('open-gmm-file', argv)
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

// 获取Mod列表数据
ipcMain.on('get-mod-list', async (event, arg) => {
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

    GetData.getModList(data).then((res) => {
        event.reply('get-mod-list-reply', res)
    }).catch((err) => {
        console.log(`err: ${err}`);
    })
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

// 获取7z路径
ipcMain.handle('get-7z-path', async (event, arg) => {
    let _7z = path7za

    if (!process.env.VITE_DEV_SERVER_URL) {
        // 如果是生产环境
        // 将 app.asar 替换为 app.asar.unpacked
        _7z = _7z.replace("app.asar", "app.asar.unpacked")
    }

    return _7z
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

// 用户登录
ipcMain.handle('user-login', async (event, arg) => {
    let res = await GetData.login(arg.username, arg.password)
    return res
})
