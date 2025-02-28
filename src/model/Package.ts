
export class Package {

    // 生成包代码 base64编码
    public static generatePackageCode(data: IModInfo[]): string {
        return Buffer.from(JSON.stringify(data)).toString('base64')
    }

    // 解析包代码 base64解码
    public static parsePackageCode(code: string): IModInfo[] {
        const str = Buffer.from(code, 'base64').toString()
        console.log(str);

        return JSON.parse(str)
    }

}