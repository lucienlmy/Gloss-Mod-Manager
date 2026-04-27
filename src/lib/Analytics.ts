/**
 * 数据统计
 */

import { app } from "@tauri-apps/api";
import { fetch } from "@tauri-apps/plugin-http";

export class AppAnalytics {
    private static generateRandomNum() {
        let randomNum = "";
        for (let i = 0; i < 32; i++) {
            randomNum += Math.floor(Math.random() * 10); //生成0到9之间的随机整数，并拼接到字符串中
        }
        return randomNum;
    }

    public static async getInstanceId() {
        let id = await PersistentStore.get<string | null>(
            "app_instance_id",
            null,
        );
        if (!id) {
            id = this.generateRandomNum();
            await PersistentStore.set("app_instance_id", id);
        }
        return id;
    }

    public static async sendEvent(event_name: string, event_value?: any) {
        // console.log(event_name, event_value);
        const user = await this.getInstanceId();
        const login = null; // TODO: 用户登录系统后替换为用户 ID
        const version = await app.getVersion();
        const language = await PersistentStore.get("language", "zh-CN");

        const data = {
            event_name,
            event_value,
            user,
            login,
            version,
            language,
        };

        const res = await fetch(`https://mod.3dmgame.com/api/gmm/analytics`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data }),
        });

        console.log({
            data: await res.json(),
        });
    }
}
