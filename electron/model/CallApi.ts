import * as https from "https";
import { app } from 'electron'
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
            "x-csrf-token": "VW9fMGVwWkgWNRwHXCgPHGMbEl4OHG4KLCkHAjBFOzAMAGtzJkY0Hg==",
            "cookie": "biny-csrf=4639103e8b845b3982ec26fc325dc1d1eecc49da11b871e249d1014b2fd8df77a%3A2%3A%7Bi%3A0%3Bs%3A9%3A%22biny-csrf%22%3Bi%3A1%3Bs%3A32%3A%22CZC79XUT6tMnkl4ByFX2U5axYo4CC6nV%22%3B%7D",
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

        const dataString = JSON.stringify(data);
        req.write(dataString);
        req.end();
    });
}
export default callApi;
