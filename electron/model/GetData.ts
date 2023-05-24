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
    // =========== 获取版本 ===========
    public static async getWebVersion() {
        let data = await callApi("https://mod.3dmgame.com/mod/API/197445");
        return data.mods_version
    }

    public static async getTypes(gameId: number) {
        return await callApi("https://mod.3dmgame.com/mod/PublishModGetModTypeList", { gameId });
    }
}