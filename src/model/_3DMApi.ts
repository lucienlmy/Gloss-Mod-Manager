import axios from "axios";
import { ipcRenderer } from "electron";

export class _3DMApi {
    static baseUrl = "https://mod.3dmgame.com/api/v3";

    private static async header() {
        const key = await ipcRenderer.invoke("get-config");
        const version = await ipcRenderer.invoke("get-version");
        return {
            authorization: key._3dm.api_key,
            "Content-Type": "application/json",
        };
    }

    /**
     * 批量检查mod更新
     * @param modId
     * @returns
     */
    public static async checkModUpdate(modId: number[]) {
        const headers = await this.header();
        const { data } = await axios.post(
            `${this.baseUrl}/mods/checkUpdate`,
            { modId },
            { headers }
        );

        return data;
    }

    /**
     * 用户登录
     * @param username
     * @param password
     * @returns
     */
    public static async userLogin(username: string, password: string) {
        const headers = await this.header();
        const { data } = await axios.post(
            `${this.baseUrl}/user/login`,
            { username, password },
            { headers }
        );
        return data;
    }

    /**
     * 获取 Mod列表
     * @param fillter
     * @returns
     */
    public static async getModList(fillter: any) {
        const headers = await this.header();

        const { data } = await axios.get(`${this.baseUrl}/mods`, {
            headers,
            params: fillter,
        });
        return data;
    }

    /**
     * 获取游戏类型
     * @param gameId
     * @returns
     */
    public static async getGameTypes(gameId: number) {
        const headers = await this.header();
        const { data } = await axios.get(`${this.baseUrl}/games/${gameId}`, {
            headers,
        });
        if (data.success) {
            return data.data.game_mod_types;
        } else {
            return [];
        }
    }

    public static async getModData(modId?: number | string) {
        const headers = await this.header();
        const { data } = await axios.get(`${this.baseUrl}/mods/${modId}`, {
            headers,
        });
        if (data.success) {
            return data.data;
        } else {
            return null;
        }
    }

    public static async getplugins() {
        const headers = await this.header();
        const { data } = await axios.post(
            `${this.baseUrl}/gmm/plugins`,
            {},
            {
                headers,
            }
        );
        if (data.success) {
            return data;
        } else {
            return null;
        }
    }
}
