import { spawn } from 'child_process'
import { FileHandler } from '@src/model/FileHandler'
import * as path from 'path';

export class APIAria2 {
    public aria2: any

    constructor() {


    }

    public static async init() {
        // 判断 aria2 是否启动存在
        if (await FileHandler.existsSync('aria2c.exe')) {
            console.log('aria2c 已启动');
            return;
        }

        // 启动 aria2
        let aria2Path = path.join(FileHandler.getResourcesPath(), 'aria2')
        // let cmd = `"${path.join(aria2Path, 'aria2c.exe')}" --conf-path="${path.join(aria2Path, 'aria2.conf')}"`;
        // console.log(cmd);

        let aria2c = spawn(path.join(aria2Path, 'aria2c.exe'), [`--conf-path`, path.join(aria2Path, 'aria2.conf')])

        aria2c.on('error', (err) => {
            console.log(`aria2c error: ${err}`);
        })
        aria2c.stderr.on('data', (data) => {
            console.log(`aria2c data: ${data}`);
        })
        aria2c.on('close', (code) => {
            console.log(`aria2c close: ${code}`);
        })
    }
}