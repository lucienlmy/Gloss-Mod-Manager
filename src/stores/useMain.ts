import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import axios from "axios";
export const useMain = defineStore("Main", {
    state: () => ({
        leftMenu: true,
        leftMenuRail: false,
        host: "https://assets-mod.3dmgame.com",
        version: "",
        webVersion: null as any,
        start: false,
    }),
    getters: {
        lazy_img: (state) => `${state.host}/assets/image/lazy_img.webp`,
    },
    actions: {
        // 格式化数字
        getNumber(num?: number) {
            let number = "";
            if (num) {
                if (num > 9999999) {
                    number = Number((num / 10000000).toFixed(1)) + "kw";
                } else if (num > 9999) {
                    number = Number((num / 10000).toFixed(1)) + "w";
                } else if (num > 999) {
                    number = Number((num / 1000).toFixed(1)) + "k";
                } else {
                    number = num.toString();
                }
            }
            return number;
        },
        // 格式化大小
        formatSiez(b: number) {
            try {
                const units = ["B", "KB", "MB", "GB"];
                let size = b;
                let unitIndex = 0;
                if (!size || size == 0) return "0B";

                while (size >= 1024 && unitIndex < units.length - 1) {
                    size /= 1024;
                    unitIndex++;
                }
                return `${size.toFixed(2)} ${units[unitIndex]}`;
            } catch (error) {
                console.log(b);
                return `${b}B`;
            }
        },
        // 获取版本号
        async getVersion() {
            let localVersion = await ipcRenderer.invoke("get-version");
            this.version = localVersion;
            const { data } = await axios.get(
                "https://mod.3dmgame.com/api/mods/197445"
            );
            this.webVersion = data.data.mods_version;
            return [localVersion, this.webVersion];
        },
        async sleep(time: number): Promise<void> {
            return new Promise((resolve) => setTimeout(resolve, time));
        },
        // 格式化时间
        formatTime(timeStr: string) {
            if (!timeStr) return "";

            try {
                const date = new Date(timeStr);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                const seconds = String(date.getSeconds()).padStart(2, "0");

                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            } catch (error) {
                return timeStr;
            }
        },
    },
});
