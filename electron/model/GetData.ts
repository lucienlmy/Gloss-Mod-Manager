import callApi from "./CallApi";

// =========== 从Mod站获取相关数据 ===========
export class GetData {
    // =========== 获取Mod列表数据 ===========
    public static async getModList(page: number = 1, pageSize: number = 24, title: string = "", original: number = 0, time: number = 0, order: number = 0, key: string = "") {
        return await callApi("/render/GetModList", { page, pageSize, title, original, time, order, key });
    }

    // =========== 获取Mod数据 ===========
    public static async getMod(id: number) {
        return await callApi("/render/GetModDataForID", { id });
    }
}