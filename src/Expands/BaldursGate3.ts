// 博德之门3 Mod支持

import { extname, basename, join } from 'path'
import { ElMessage } from "element-plus";
import { homedir, } from "os";
import { statSync } from "fs";
// const xml2js = require('xml2js')
// var convert = require('xml-js');
import convert from 'xml-js'

// import { XMLParser, XMLBuilder } from 'fast-xml-parser'


interface IAttribute {
    _attributes: {
        id: string
        type: string
        value: string
    }
}

//#region pack

let modsettings = {
    get data() {
        const file = join(FileHandler.GetAppData(), 'Local', 'Larian Studios', "Baldur's Gate 3", 'PlayerProfiles', 'Public', 'modsettings.lsx')
        const data = FileHandler.readFile(file)
        // return xml2js.parseStringPromise(data)
        return convert.xml2js(data, { compact: true })
    },
    set data(value) {
        const file = join(FileHandler.GetAppData(), 'Local', 'Larian Studios', "Baldur's Gate 3", 'PlayerProfiles', 'Public', 'modsettings.lsx')
        // const data = new xml2js.Builder().buildObject(value)
        const data = convert.js2xml(value, { compact: true, spaces: 4 })
        if (data) FileHandler.writeFile(file, data)
    }
}

async function LoadModDataFromPak(pakPath: string) {
    const edge = require('electron-edge-js-v33-only')
    const manager = useManager()

    try {

        let assemblyFile = join(manager.modStorage ?? "", manager.getModInfoByWebId(200783)?.id.toString() ?? "", 'BaldursGate3.dll')
        // console.log(assemblyFile);

        let Invoke = edge.func({
            assemblyFile: assemblyFile,
            typeName: 'BaldursGate3.Program',
            methodName: 'LoadModDataFromPakAsync'
        })
        return new Promise<IAttribute[]>((resolve, reject) => {
            Invoke(pakPath, async (error: any, result: any) => {
                if (error) reject(error);
                let attribute: IAttribute[] = []
                if (result) {
                    // let data = await xml2js.parseStringPromise(result) 
                    const data: convert.ElementCompact = convert.xml2js(result, { compact: true })
                    data.save.region.node.children.node.forEach((item: any) => {
                        if (item._attributes?.id == "ModuleInfo") {
                            console.log(item.attribute);
                            attribute = item.attribute
                        }
                    })

                }
                resolve(attribute);
            })
        })
    } catch (error) {
        console.log(error);

        ElMessage.error(`错误: ${error}`)
    }

}

async function handlePak(mod: IModInfo, installPath: string, isInstall: boolean) {

    if (!Manager.checkInstalled("博德之门3 前置插件 For GMM", 200783)) return false

    // if (isInstall) if (!Manager.checkInstalled("Patch 3 Mod Fixer", 200740)) return false
    let res: IState[] = []
    let manager = useManager()

    let modsettings_data: convert.ElementCompact = await modsettings.data
    console.log('modsettings_data', modsettings_data);

    // let root = modsettings_data.save.region[0].node[0].children[0].node
    let root = modsettings_data.save.region.node.children.node
    console.log('root', root);
    if (!root.children || !root.children.node) {
        // 如果用户是第一次装Mod
        // console.log('第一次装Mod');
        // root[0] = {
        //     $: {
        //         id: 'ModOrder'
        //     },
        //     children: [
        //         {
        //             node: []
        //         }
        //     ]
        // }
    }

    for (let index = 0; index < mod.modFiles.length; index++) {
        const item = mod.modFiles[index];
        let modStorage = join(manager.modStorage ?? "", mod.id.toString(), item)
        if (statSync(modStorage).isFile()) {
            if (extname(item) == '.pak') {
                if (isInstall) FileHandler.copyFile(modStorage, join(installPath, basename(item)))
                else FileHandler.deleteFile(join(installPath, basename(item)))

                let meta = await LoadModDataFromPak(modStorage)
                if (meta) {
                    let ModuleShortDesc = meta.filter(item => (item._attributes.id == 'Folder' || item._attributes.id == 'MD5' || item._attributes.id == 'Name' || item._attributes.id == 'UUID' || item._attributes.id == 'Version64' || item._attributes.id == 'PublishHandle'))
                    console.log(ModuleShortDesc)

                    if (ModuleShortDesc.length > 0) {
                        if (isInstall) {
                            // 安装
                            console.log(root)

                            if (!Array.isArray(root.children.node)) {
                                root.children.node = [root.children.node]
                            }

                            root.children.node.push({
                                "_attributes": {
                                    "id": "ModuleShortDesc"
                                },
                                "attribute": [...ModuleShortDesc]
                            })

                            // ModOrder 中添加 UUID
                            // root[0].children[0].node.push({
                            //     $: {
                            //         id: "Module"
                            //     },
                            //     attribute: [
                            //         {
                            //             $: {
                            //                 id: "UUID",
                            //                 type: "FixedString",
                            //                 value: ModuleShortDesc.find(item => item.$.id == 'UUID')?.$.value,
                            //             }
                            //         }
                            //     ]
                            // })
                            // // Mods 中添加 数据
                            // root[1].children[0].node.push({
                            //     $: {
                            //         id: 'ModuleShortDesc'
                            //     },
                            //     attribute: [...ModuleShortDesc]
                            // })
                        } else {
                            // 卸载
                            // ModOrder 中删除 UUID
                            // root.children.node = root.children.node.filter((item: IAttribute) => item._attributes.id )

                            const uuid = ModuleShortDesc.find(item => item._attributes.id == 'UUID')?._attributes.value

                            root.children.node = root.children.node.filter((item: any) => item.attribute.find((item: IAttribute) => item._attributes.id == 'UUID')?._attributes.value != uuid)

                            // root[0].children[0].node = root[0].children[0].node.filter((item: any) => item?.attribute[0].$.value != ModuleShortDesc.find(item => item.$.id == 'UUID')?.$.value)
                            // // Mods 中删除 数据
                            // root[1].children[0].node = root[1].children[0].node.filter((item: any) => {
                            //     let uuid = item?.attribute.find((item: any) => item.$.id == 'UUID')
                            //     if (uuid) return uuid.$.value != ModuleShortDesc.find(item => item.$.id == 'UUID')?.$.value
                            //     else return true
                            // })
                        }
                    }
                    modsettings.data = modsettings_data
                }
            }
        }
    }
    return true
}

//#endregion

export const supportedGames: ISupportedGames = {
    GlossGameId: 240,
    steamAppID: 1086940,
    mod_io: 6715,
    nexusMods: {
        game_domain_name: 'baldursgate3',
        game_id: 3474
    },
    installdir: join("Baldurs Gate 3", "bin"),
    gameName: "Baldurs Gate 3",
    gameExe: [
        {
            name: 'bg3.exe',
            rootPath: join('..')
        },
        {
            name: 'bg3_dx11.exe',
            rootPath: join('..')
        }
    ],
    startExe: [
        {
            name: 'Steam 启动',
            cmd: 'steam://rungameid/1086940'
        },
        {
            name: 'Vulkan',
            exePath: join('bin', 'bg3.exe')
        },
        {
            name: 'DirectX 11',
            exePath: join('bin', 'bg3_dx11.exe')
        },
    ],
    archivePath: join(FileHandler.GetAppData(), 'Local', 'Larian Studios', "Baldur's Gate 3"),
    gameCoverImg: "https://mod.3dmgame.com/static/upload/game/5f9fc80ea912c.png",
    modType: [
        {
            id: 1,
            name: 'pak',
            installPath: join(homedir(), 'AppData', 'Local', 'Larian Studios', "Baldur's Gate 3", 'Mods'),
            async install(mod) {
                try {
                    return handlePak(mod, this.installPath ?? "", true)
                } catch (error) {
                    ElMessage.error(`错误: ${error}`)
                    return false
                }
            },
            async uninstall(mod) {
                return handlePak(mod, this.installPath ?? "", false)
            },
        },
        {
            id: 2,
            name: 'Data',
            installPath: join('Data'),
            async install(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "data", true, false, true)
            },
            async uninstall(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "data", false, false, true)
            }
        },
        {
            id: 3,
            name: '插件',
            installPath: '',
            async install(mod) {
                if (mod.webId == 201398) {
                    // 安装 Native Mod Loader
                    let manager = useManager()

                    mod.modFiles.forEach(item => {
                        let modStorage = join(manager.modStorage ?? "", mod.id.toString(), item)
                        if (statSync(modStorage).isFile()) {
                            let file = FileHandler.getFolderFromPath(item, 'bin')
                            let gameStorage = join(manager.gameStorage ?? "", file ?? "", item)
                            FileHandler.copyFile(modStorage, gameStorage)
                        }
                    })
                }
                return true
            },
            async uninstall(mod) {
                if (mod.webId == 201398) {
                    // 卸载 Native Mod Loader
                    let manager = useManager()
                    mod.modFiles.forEach(item => {
                        let modStorage = join(manager.modStorage ?? "", mod.id.toString(), item)
                        if (statSync(modStorage).isFile()) {
                            let file = FileHandler.getFolderFromPath(item, 'bin')
                            let gameStorage = join(manager.gameStorage ?? "", file ?? "", item)
                            FileHandler.deleteFile(gameStorage)
                        }
                    })
                }
                return true
            }
        },
        {
            id: 4,
            name: 'NativeMods',
            installPath: join('bin', 'NativeMods'),
            async install(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "NativeMods", true)
            },
            async uninstall(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "NativeMods", false)
            }
        },
        {
            id: 5,
            name: 'bin',
            installPath: join('bin'),
            async install(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "bin", true)
            },
            async uninstall(mod) {
                return Manager.installByFolder(mod, this.installPath ?? "", "bin", false)
            }
        },
        {
            id: 6,
            name: "bg3se",
            installPath: join('bin'),
            async install(mod) {
                return Manager.generalInstall(mod, this.installPath ?? "", true)
            },
            async uninstall(mod) {
                return Manager.generalUninstall(mod, this.installPath ?? "", true)
            }
        },
        {
            id: 99,
            name: '未知',
            installPath: '',
            async install(mod) {
                ElMessage.warning("该mod类型未知, 无法自动安装, 请手动安装!")
                return false
            },
            async uninstall(mod) {
                return true
            }
        }
    ],
    checkModType(mod) {
        let plugins = [200783, 201398]
        if (plugins.includes((mod.webId ?? 0) as number)) return 3

        let pak = false
        let data = false
        let native = false
        let bin = false
        let bg3se = false

        mod.modFiles.forEach(item => {
            let exe = extname(item)
            if (exe === '.pak') pak = true
            if (item.toLowerCase().includes('public')) data = true
            if (item.toLowerCase().includes('data')) data = true
            if (item.toLowerCase().includes('bin')) bin = true
            if (exe == '.dll') native = true
            if (basename(item).toLowerCase() == 'DWrite.dll'.toLowerCase()) bg3se = true
        })

        if (bg3se) return 6

        if (pak) return 1
        if (data) return 2
        if (bin) return 5
        if (native) return 4

        return 99
    }
}