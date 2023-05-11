import callApi from "./CallApi";

// =========== 从Mod站获取相关数据 ===========
export class GetData {
    // =========== 获取Mod列表数据 ===========
    public static async getModList(data: any) {
        return await callApi("/render/GetModList", data);
    }

    // =========== 获取Mod数据 ===========
    public static async getMod(id: number) {
        return await callApi("/render/GetModDataForID", { id });
    }
}