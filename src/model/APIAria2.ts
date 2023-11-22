// Aria2 下载相关
import { spawn } from 'child_process'
import { FileHandler } from '@src/model/FileHandler'
import * as path from 'path'
import { IAria2Request } from "@src/model/Interfaces";

import axios from 'axios'
import { Subject, filter } from 'rxjs';


export class APIAria2 {
    // public aria2: any
    // socket: WebSocket;
    // listener: Subject<any>;


    constructor() {
        // this.socket = new WebSocket('ws://localhost:6800/jsonrpc')

        // this.listener = new Subject();

        // this.socket.onmessage = (event: any) => {
        //     this.listener.next(JSON.parse(event.data))
        // }

    }

    // 启动 aria2c
    public static async init() {
        // 判断 aria2 是否启动存在
        if (await FileHandler.existsSync('aria2c.exe')) {
            console.log('aria2c 已启动');
            return;
        }

        // 启动 aria2
        let aria2Path = path.join(FileHandler.getResourcesPath(), 'aria2')
        let aria2c = spawn(path.join(aria2Path, 'aria2c.exe'), [`--conf-path`, path.join(aria2Path, 'aria2.conf')], {
            windowsHide: false,
            stdio: 'pipe',
        })
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

        aria2c.on('close', (code) => {
            console.log(`aria2c close: ${code}`);
        })
    }

    public static Token() {
        return '4Oe86X40FICqdNL3i9RnStRcrkNgkIA2kxK3cbQVHykQAJeIeT'
    }

    public static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = (c === 'x') ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // 发送消息
    public send(request: IAria2Request): Promise<any> {
        // return new Promise((resolve, reject) => {
        if (!request.id) request.id = APIAria2.uuid()
        request.params = [`token:${APIAria2.Token()}`, ...request.params]
        return axios.post(`http://localhost:6800/jsonrpc`, request).then(({ data }) => {
            return data
        }).catch(err => {
            return err
        })

        //     if (this.socket.readyState == 1) {
        //         request.params = [`token:${APIAria2.Token()}`, ...request.params]
        //         this.socket.send(JSON.stringify(request))
        //         this.listener.pipe(
        //             filter((msg: any) => msg.id === request.id),
        //             // pluck('result'),
        //             // map(x => x?.result)
        //         ).subscribe(resolve);
        //     } else {
        //         console.log("readyState", this.socket.readyState);
        //         reject(`错误: ${this.socket.}`)
        //     }
        // })
    }

    // 创建下载
    public async addUri(uri: string, name: string, dir: string) {
        APIAria2.init();
        return this.send({
            jsonrpc: '2.0',
            method: 'aria2.addUri',
            params: [
                [uri],
                {
                    dir: dir,
                    out: name
                }
            ]
        });
    }

    // 暂停
    public async pause(gid: string) {
        return this.send({
            jsonrpc: '2.0',
            id: 'pause',
            method: 'aria2.pause',
            params: [gid],
        });

    }

    // 恢复
    public async unpause(gid: string) {
        return this.send({
            jsonrpc: '2.0',
            id: 'unpause',
            method: 'aria2.unpause',
            params: [gid],
        });
    }

    // 下载进度
    public onProgress(gid: string) {
        return this.send({
            jsonrpc: '2.0',
            id: 'progress',
            method: 'aria2.tellStatus',
            params: [gid, ["gid", "status", "totalLength", "completedLength", "downloadSpeed", "dir"]],
        })
        // return this.listener.pipe(
        //     filter((msg: any) => msg.result?.gid === gid),
        //     // pluck('params', '1'),
        // );
    }

    // 下载列表
    public getDownloadList(): Promise<any> {
        return this.send({
            jsonrpc: '2.0',
            id: 'list',
            method: 'aria2.tellActive',
            params: [],
        });
    }

    // public tellStatus(gid: string) {
    //     return this.send({
    //         jsonrpc: '2.0',
    //         id: 'progress',
    //         method: 'aria2.tellStatus',
    //         params: [gid, ["gid", "status", "totalLength", "completedLength", "downloadSpeed", "dir"]],
    //     })
    // }

}