import * as https from "https";
import { app } from 'electron'
import { Config } from './Config'

/**
 * 封装的请求接口方法
 * @param endpoint 
 * @param data 
 * @returns 
 */
async function callApi(path: string, data: any = {}, hostname: string = "mod.3dmgame.com"): Promise<any> {
    let version = app.getVersion()
    const options: https.RequestOptions = {
        hostname, path,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-csrf-token": Config.Api._3dm.token,
            "cookie": Config.Api._3dm.csrf,
            "User-Agent": `Gloss Mod Manager (gmm)/${version}`,
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => {
                body += chunk;
            });
            res.on("end", () => {
                const result = JSON.parse(body);
                resolve(result);
            });
        });

        req.on("error", (error) => {
            reject(error);
        });

        let dataString: string = ''
        try {
            dataString = JSON.stringify(data);
        } catch (error) {
            reject(new Error("Failed to stringify data: " + error));
            return;
        }

        req.write(dataString);
        req.end();
    });
}
export default callApi;
