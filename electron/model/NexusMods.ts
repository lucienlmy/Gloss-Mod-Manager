import * as https from "https";
import { ClientRequestConstructorOptions, app, net } from 'electron'


export class NexusMods {

    // 发送请求 GET
    public static Request_GET(url: string, headers?: any,): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = net.request({
                method: "GET", url, headers
            } as ClientRequestConstructorOptions)

            request.on('response', (response) => {
                let data;
                response.on('data', (chunk) => {
                    if (chunk) {
                        data += chunk
                    }
                })
                response.on("end", () => {
                    resolve(data.toString())
                })
                response.on('error', (error) => {
                    reject(error)
                })
            })

            request.end()
        });
    }

    // 发送请求 POST  Form Data 格式
    public static Request_POST(url: string, data: any, headers?: any,): Promise<any> {
        return new Promise((resolve, reject) => {

            headers['Content-Type'] = 'application/x-www-form-urlencoded';

            const request = net.request({
                method: "POST", url, headers
            } as ClientRequestConstructorOptions)

            request.on('response', (response) => {
                let res_data;
                response.on('data', (chunk) => {
                    if (chunk) {
                        res_data += chunk
                    }
                })
                response.on("end", () => {
                    resolve(res_data.toString())
                })
                response.on('error', (error) => {
                    reject(error)
                })
            })

            // 将数据对象转换为Form Data格式（键=值&键=值）
            let formData = '';
            for (let key in data) {
                formData += `${key}=${encodeURIComponent(data[key])}&`;
            }
            formData = formData.slice(0, -1); // 删除最后的"&"

            request.write(formData)
            request.end()
        });
    }

    public static GetModList(data: any) {
        let url = "https://www.nexusmods.com/Core/Libs/Common/Widgets/ModList"


        // 将 RH_ModList 转换为 game_id:3333,page_size:24,page:1,sort_by:lastupdate
        let RH_ModList = Object.keys(data).map((key) => `${key}:${data[key]}`).join(',')
        // console.log(RH_ModList);

        return this.Request_GET(`${url}?RH_ModList=${RH_ModList}`, {
            'X-Requested-With': 'XMLHttpRequest'
        })
    }

    public static GetModData(data: any) {
        return this.Request_GET(`https://api.nexusmods.com/v1/games/${data.game_domain_name}/mods/${data.id}.json`, {
            "accept": "application/json",
            "apikey": data.apikey
        })
    }

    public static async GetDownloadUrl(data: any) {
        let cookies = {
            "sid_develop": JSON.stringify({ "mechanism": "defuse_compact", "ciphertext": "3vUCANeKI4YGjry1vFzC79d0_zWFW3Z0ZNuGGOy2neKDil2M9jaaHuiGiShy_f3Q6_UCA7WhUKUKT3c2USpvqAiUVlZiwkPDb_MLlCowpBeL4JftybjKrxLdc9xEttGJyNAqO7zFLfNCqU-Lv9IX4tC4VLGFoGYdZOP3NljcHcmxMJ6epc6ACbURbJrmr-HzZ2o0mf81JirnlvtX-GjGqtkFNtKAYYNOlKoyI_c3zKgpBUov3gEdzpdvmglODQ-wUT1xs0_a_ceQWZq87K0MxuyFpM8wWAOaNS924yYd0RpN46sWkIvOBvJKBY0lBlx7Xprk2Q7WC3Oyt-1lvSBjMWC_WObKn-5RRXfADwo7cNQ3QRJDGO-lETesTEIko1WZ3pDfXTdguj3KU3ar2u07HG1GAmuclA3vydS3QM7qixJV63xe5AhoU97HPVcyeOuACTj8WQSPo7DKdIDyC7V_78PF0yrG2NS_4DY8HK9sl_N2MCeMnfUff0HDj1b-r6NmKWCBGnMZuebRiB3LxQ4RCynRBfwMeRxsfI6dRwGl8zt78c_HMQR6Nla8IY8i9K39ZQ6rYH8HPLr_u3D2rzbYAwXC2rBCGUq3X_exLwIbNMHV-Jpm_t7ipPM4t-CuwamNXNNV0So4CF6Ce8vf_IrOSAn3Sb_6j75CMoJi4I70NZ1I34OPyXC7Hd_InfvFsNaIbDgOKsBesSWWjoKQw9unTKzmxbo9Rd7CMr5m7HMYQKClEg-OlsE0JOXj_i5965j6JfkqKlfPaeygp5qUBQv-hmhI9Bb28xuR6hktlHD58yBU8dmD3Z1FBBvl_rR5QjWy147XlJIKXuP136Opg_Na0VubzGzj2XGLXoTsgK-2dYMUdvcr_rFw5n96dp02tVoHYFnkAxbTNTLpwAhns9jjJoJr1SQVHQ" })
        }

        // 获取 file_id
        let res = await this.Request_GET(`https://api.nexusmods.com/v1/games/${data.game_domain_name}/mods/${data.id}/files.json?category=main`, {
            "accept": "application/json",
            "apikey": data.apikey
        })
        // console.log(res);
        res = res.replace(/undefined/g, '')
        let { files } = JSON.parse(res)
        let fid = files[0].file_id
        let game_id = files[0].id[1]

        // https://www.nexusmods.com/cyberpunk2077/mods/1347?tab=files&file_id=56545

        // 转换 cookies 格式
        let cookie = ''
        for (let key in cookies) {
            cookie += `${key}=${cookies[key]};`
        }

        return this.Request_POST(`https://www.nexusmods.com/Core/Libs/Common/Managers/Downloads?GenerateDownloadUrl`, {
            fid, game_id
        }, {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
            "Cookie": cookie,
            "Referer": `https://www.nexusmods.com/${data.game_domain_name}/mods/${data.id}?tab=files&file_id=${fid}`,
            "X-Requested-With": "XMLHttpRequest"
        })

    }


}