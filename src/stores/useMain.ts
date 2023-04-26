import { defineStore } from "pinia";

export const useMain = defineStore('Main', {
    state: () => ({
        leftMenu: true,
        leftMenuRail: false,
        host: 'https://mod.3dmgame.com',
    }),
    getters: {
        lazy_img: (state) => `${state.host}/assets/image/lazy_img.webp`
    },
    actions: {
        // 格式化数字
        get_number(num?: number) {
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
    }
})