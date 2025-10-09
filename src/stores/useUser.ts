import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import { ElMessage } from "element-plus";
import QRCode from "qrcode";
import crypto from "crypto";
import { _3DMApi } from "@/model/_3DMApi";

export const useUser = defineStore("User", {
    state: () => ({
        user: null as IUser | null,
        loginBox: false,
        username: "",
        password: "",
        remember: true,
        code: null as string | null,
        timer: null as NodeJS.Timeout | null,
        collect: {
            list: [] as IMod[],
            page: 1,
            count: 1,
        },
        nexusModsUser: {} as INexusModsUser,
    }),
    getters: {
        getUserAvatar(state) {
            if (state.user?.user_avatar) {
                // 判断是否包含 my.3dmgame.com
                if (state.user.user_avatar.indexOf("my.3dmgame.com") != -1) {
                    return state.user.user_avatar;
                } else {
                    return `https://assets-mod.3dmgame.com${state.user.user_avatar}`;
                }
            }
        },
        collectLength(state) {
            // 计算页数
            return Math.ceil(state.collect.count / 10);
        },
    },
    actions: {
        async login(username: string, password: string) {
            // return new Promise((resolve, reject) => {
            //     ipcRenderer.invoke("user-login", { username, password }).then((data) => {
            //         if (data.code == "00") {
            //             // console.log(data);
            //             let ueer = data.user[0]
            //             this.saveUser(ueer)
            //             this.loginBox = false
            //             resolve(ueer)
            //         } else {
            //             ElMessage.error(data.msg)
            //             reject(data.msg)
            //         }
            //     })
            // })

            const data = await _3DMApi.userLogin(username, password);
            if (data.success) {
                console.log(data);
                const ueer = data.data.user;
                this.saveUser(ueer);
                this.loginBox = false;
                return ueer;
            }
        },
        async logout() {
            // LocalStorageHelper.removeItem("user")
            ElectronStore.removeStore("user");
            this.user = null;
            ElMessage.success("登出成功.");
        },
        saveUser(user: IUser) {
            this.user = user;
            // 15 天
            let timeout = new Date().getTime() + 1000 * 60 * 60 * 24 * 15;
            user.timeout = timeout;
            ElectronStore.setStore("user", user);
            ElMessage.success("登录成功.");
        },

        async getUser() {
            let user = await ElectronStore.getStore<any>("user");
            if (user) {
                // console.log(user.timeout, new Date().getTime());
                if (user.timeout < new Date().getTime()) {
                    // 登录过期, 清除登录信息
                    ElectronStore.removeStore("user");
                    this.user = null;
                } else {
                    this.user = user;
                }
            }
            const nexusModsUser = await ElectronStore.getStore<INexusModsUser>(
                "nexusModsUser"
            );
            if (nexusModsUser) {
                this.nexusModsUser = nexusModsUser;
            }
        },
        async getQrcode(canvas: HTMLCanvasElement) {
            let code = this.createCode();
            QRCode.toCanvas(canvas, code, {
                version: 5,
                errorCorrectionLevel: "high",
                maskPattern: 7,
                width: 256,
                color: {
                    dark: "#fff",
                    light: "#212121",
                },
            });
        },
        createCode() {
            if (!this.code) {
                const time = new Date().getTime();
                const InstanceId = AppAnalytics.getInstanceId();
                this.code = crypto
                    .createHash("md5")
                    .update(`${InstanceId}${time}`)
                    .digest("hex");
                this.code = `3dmmod://${this.code}`;
            }
            return this.code;
        },
        async checkQrcodeLogin() {
            if (this.user) {
                clearInterval(this.timer!);
            }
            let code = this.createCode();
            fetch(`https://assets-mod.3dmgame.com/gmm/checkLogin`, {
                method: "POST",
                body: JSON.stringify({ code }),
            }).then(async (res) => {
                let text = JSON.parse(await res.text());
                if (text.code == "00") {
                    this.saveUser(text.user);
                    this.loginBox = false;
                    this.code = null;
                    clearInterval(this.timer!);
                }
            });
        },
        getCollectList() {
            ipcRenderer
                .invoke("get-favorite-list", {
                    page: this.collect.page,
                    pageSize: 10,
                    userId: this.user?.id,
                })
                .then((data) => {
                    console.log(data);
                    if (data.code == "00") {
                        this.collect.list = data.data.mod;
                        this.collect.count = data.data.count;
                    } else {
                        ElMessage.warning(data.msg);
                    }
                });
        },
        loginNexusModsUser() {
            let application_slug = "gloss";
            const ws = new WebSocket("wss://sso.nexusmods.com");
            ws.onopen = (event) => {
                let uuid = sessionStorage.getItem("uuid");
                let token = sessionStorage.getItem("connection_token");

                if (uuid == null) {
                    uuid = APIAria2.uuid();
                    sessionStorage.setItem("uuid", uuid);
                }

                if (uuid !== null) {
                    var data = {
                        id: uuid,
                        token: token,
                        protocol: 2,
                    };
                    ws.send(JSON.stringify(data));
                    window.open(
                        "https://www.nexusmods.com/sso?id=" +
                            uuid +
                            "&application=" +
                            application_slug
                    );
                } else {
                    console.error("uuid 错误~");
                }
            };

            ws.onclose = (event) => {
                console.log("连接关闭;");
            };

            ws.onmessage = async (event) => {
                const response = JSON.parse(event.data);

                if (response && response.success) {
                    // 如果成功, 检查数据是否包含 connection_token 或 api_key
                    if (response.data.hasOwnProperty("connection_token")) {
                        // 存储连接令牌，以防我们需要重新连接
                        sessionStorage.setItem(
                            "connection_token",
                            response.data.connection_token
                        );
                    } else if (response.data.hasOwnProperty("api_key")) {
                        this.nexusModsUser.key = response.data.api_key;
                        const nexusMods = useNexusMods();
                        const data = await nexusMods.getUserData();
                        if (data.key) {
                            this.nexusModsUser = data;
                            ElMessage.success(`${data.name} 登录成功~`);
                            ElectronStore.setStore("nexusModsUser", data);
                        }

                        ws.close();
                    }
                } else {
                    // The SSO  will return an error attribute that can be used for error reporting
                    console.error("Something went wrong! " + response.error);
                }
            };
        },
        async logoutNexusModsUser() {
            this.nexusModsUser = {} as INexusModsUser;
            ElectronStore.removeStore("nexusModsUser");
            ElMessage.success("注销成功~");
        },
    },
});
