// Aria2 下载相关
import { spawn } from 'child_process'
import * as path from 'path'
import axios from 'axios'

export class APIAria2 {
    static retrytimes = 0

    constructor() {

    }

    // 启动 aria2c
    public static async init() {
        // 判断 aria2 是否启动存在
        try {
            // 尝试连接而不是检查文件
            const response = await APIAria2.send({
                "jsonrpc": "2.0",
                "method": "aria2.getVersion",
                "id": APIAria2.uuid(),
                params: []
            });

            if (response) {
                console.log('aria2c 已启动');
                return;
            }
        } catch (error) {
            console.log('aria2c 未启动，准备启动');
            // 继续执行启动流程
        }

        const settings = useSettings()

        let proxy: any[] = []
        if (settings.settings.downloadProxy != '') {
            // 设置代理
            proxy = ['--all-proxy', settings.settings.downloadProxy,]
        }

        // 启动 aria2
        let aria2Path = path.join(await FileHandler.getResourcesPath(), 'aria2')
        console.log("aria2Path", aria2Path);

        let aria2c = spawn(path.join(aria2Path, 'aria2c.exe'), [`--conf-path`, path.join(aria2Path, 'aria2.conf'), ...proxy], {
            windowsHide: false,
            stdio: 'pipe',
        })
        aria2c.on('error', (err) => {
            console.log(`aria2c error: ${err}`);
            // 重试
            setTimeout(() => {
                APIAria2.init()
            }, 1000);
        })
        aria2c.stdout.on('data', (data) => {
            let str = data.toString()
            // 移除空格
            str = str.replace(/\s+/g, "")
            if (str != "") {
                console.log(`aria2c stdout===>: ${data}`);
            }
        })

        aria2c.on('close', (code) => {
            console.log(`aria2c close: ${code}`);
        })
    }

    // 关闭 aria2c
    public static async close() {
        // 关闭 aria2c
        const aria2c = spawn('taskkill', ['/F', '/IM', 'aria2c.exe'])
        aria2c.on('error', (err) => {
            console.log(`aria2c error: ${err}`);
        })
        aria2c.stdout.on('data', (data) => {
            let str = data.toString()
            // 移除空格
            str = str.replace(/\s+/g, "")
            if (str != "") {
                console.log(`aria2c stdout===>: ${data}`);
            }
        })
    }

    // 重启 aria2c
    public static async restart() {
        // 关闭 aria2c
        await APIAria2.close()
        // 重启 aria2c
        setTimeout(() => {
            APIAria2.init()
            ElMessage.success('Aria2 已重启')
        }, 1000);
    }

    public static Token() {
        // return '4Oe86X40FICqdNL3i9RnStRcrkNgkIA2kxK3cbQVHykQAJeIeT'
        return ''
    }

    public static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = (c === 'x') ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public static randomNumbers() {
        return Math.floor(Math.random() * 1000000000)
    }

    // 发送消息
    public static async send(request: IAria2Request) {
        if (!request.id) request.id = APIAria2.uuid()
        const { data } = await axios.post(`http://localhost:6800/jsonrpc`, request)
        return data;
    }

    // 创建下载
    public static addUri(uri: string, name: string, dir: string) {
        return this.send({
            jsonrpc: '2.0',
            method: 'aria2.addUri',
            params: [
                [uri],
                {
                    dir: dir,
                    out: name,
                    'follow-metalink': 'mem',
                }
            ]
        });
    }

    // 暂停
    public static async pause(gid: string) {
        return this.send({
            jsonrpc: '2.0',
            id: 'pause',
            method: 'aria2.pause',
            params: [gid],
        });

    }

    // 恢复
    public static async unpause(gid: string) {
        return this.send({
            jsonrpc: '2.0',
            id: 'unpause',
            method: 'aria2.unpause',
            params: [gid],
        });
    }

    // 删除
    public static async remove(gid: string) {
        return this.send({
            jsonrpc: '2.0',
            id: 'remove',
            method: 'aria2.remove',
            params: [gid],
        });
    }

    // 下载进度
    public static onProgress(gid: string) {
        return this.send({
            jsonrpc: '2.0',
            id: 'progress',
            method: 'aria2.tellStatus',
            // ["gid", "status", "totalLength", "completedLength", "downloadSpeed", "dir", "errorMessage"]
            params: [gid],
        })
        // return this.listener.pipe(
        //     filter((msg: any) => msg.result?.gid === gid),
        //     // pluck('params', '1'),
        // );
    }

    // 下载列表
    public static getDownloadList(): Promise<any> {
        return this.send({
            jsonrpc: '2.0',
            id: 'list',
            method: 'aria2.tellActive',
            params: [],
        });
    }

    public static async test() {
        APIAria2.send({
            "jsonrpc": "2.0",
            "method": "aria2.getGlobalStat",
            "id": APIAria2.uuid(),
            params: []
        }).then(() => {
            console.log('success');
        }).catch((err) => {
            this.retrytimes++

            ElMessage.error('Aria2连接失败! 下载功能可能受影响');

            if (this.retrytimes > 3) {
                console.log('Aria2连接失败! 下载功能可能受影响!');
                return
            }
            // // 重试
            // this.restart().then(() => {
            //     this.test()
            // })
        })
    }

}