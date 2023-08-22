import crypto from 'crypto'
import { join } from 'path'
import { Config } from "@src/model/Config";
import { FileHandler } from '@src/model/FileHandler'

export class ElectronStore {

    private static key = Buffer.from([53, 109, 4, 104, 98, 90, 156, 151, 117, 28, 6, 141, 146, 10, 31, 84, 179, 240, 115, 0, 55, 244, 208, 228, 99, 23, 107, 149, 54, 213, 136, 157])
    private static iv = Buffer.from([97, 168, 108, 221, 110, 76, 110, 190, 119, 216, 137, 60, 120, 84, 88, 30])
    private static cache = join(Config.configFolder(), 'gmm.cache')

    /**
     * 加密数据
     * @param data 数据
     * @returns 
     */
    private static encryptData(data: any) {
        const cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv);
        let encrypted = cipher.update(data, 'utf-8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    /**
     * 解密数据
     * @param encryptedData 数据
     * @returns 
     */
    private static decryptData(encryptedData: any) {
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');
        return decrypted;
    }

    /**
     *设置本地储存
     * @param key 
     * @param value 
     */
    public static async setStore(key: string, value: any) {
        let data = await FileHandler.readFileSync(this.cache, this.encryptData('{}'))
        let json = JSON.parse(this.decryptData(data))
        // console.log(json);
        json[key] = value
        FileHandler.writeFile(this.cache, this.encryptData(JSON.stringify(json)))
    }

    /**
     * 获取本地储存
     * @param key 
     * @returns 
     */
    public static async getStore(key: string) {
        let data = await FileHandler.readFileSync(this.cache, this.encryptData('{}'))
        let json = JSON.parse(this.decryptData(data))
        return json[key]
    }

    /**
     * 移除本地储存
     * @param key 
     */
    public static async removeStore(key: string) {
        let data = await FileHandler.readFileSync(this.cache, this.encryptData('{}'))
        let json = JSON.parse(this.decryptData(data))
        delete json[key]
        FileHandler.writeFile(this.cache, this.encryptData(JSON.stringify(json)))
    }

    /**
     * 清空本地储存
     */
    public static async clear() {
        FileHandler.writeFile(this.cache, this.encryptData('{}'))
    }

}