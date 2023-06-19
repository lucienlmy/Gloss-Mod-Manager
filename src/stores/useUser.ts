import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import type { IUser } from "@src/model/Interfaces";
import { ElectronStore } from '@src/model/ElectronStore'
import { ElMessage } from "element-plus";
import QRCode from 'qrcode'
import crypto from "crypto";
import { AppAnalytics } from "@src/model/Analytics"


export const useUser = defineStore('User', {
    state: () => ({
        user: null as IUser | null,
        loginBox: false,
        username: '',
        password: '',
        remember: true,
        code: null as string | null,
        timer: null as NodeJS.Timeout | null
    }),
    getters: {
    },
    actions: {
        async login(username: string, password: string) {
            return new Promise((resolve, reject) => {
                ipcRenderer.invoke("user-login", { username, password }).then((data) => {
                    if (data.code == "00") {
                        // console.log(data);
                        let ueer = data.user[0]
                        this.saveUser(ueer)
                        this.loginBox = false
                        resolve(ueer)
                    } else {
                        ElMessage.error(data.msg)
                        reject(data.msg)
                    }
                })
            })
        },
        async logout() {
            // LocalStorageHelper.removeItem("user")
            ElectronStore.removeStore("user")
            this.user = null
            ElMessage.success('登出成功.')
        },
        saveUser(user: IUser) {
            this.user = user
            ElectronStore.setStore("user", user)
            ElMessage.success('登录成功.')
        },

        async getUser() {
            let user = await ElectronStore.getStore("user")
            console.log("user", user);

            if (user) {
                this.user = user
            }
        },
        async getQrcode(canvas: HTMLCanvasElement) {
            let code = this.createCode()
            QRCode.toCanvas(canvas, code, {
                version: 5,
                errorCorrectionLevel: 'high',
                maskPattern: 7,
                width: 256,
                color: {
                    dark: "#fff",
                    light: "#212121"
                }
            })
        },
        createCode() {
            if (!this.code) {
                const time = new Date().getTime()
                const InstanceId = AppAnalytics.getInstanceId()

                this.code = crypto.createHash('md5').update(`${InstanceId}${time}`).digest('hex')
                this.code = `3dmmod://${this.code}`

            }
            return this.code
        },
        async checkQrcodeLogin() {

            if (this.user) {
                clearInterval(this.timer!)
            }

            let code = this.createCode()
            fetch(`https://mod.3dmgame.com/gmm/checkLogin`, {
                method: "POST",
                body: JSON.stringify({ code })
            }).then(async (res) => {
                let text = JSON.parse(await res.text())
                // console.log(text);
                if (text.code == '00') {
                    this.saveUser(text.user)
                    this.loginBox = false
                    this.code = null
                    clearInterval(this.timer!)
                }
            })
        }
    }
})