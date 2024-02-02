/**
 * 虚幻引擎通用安装
 */

import { join, basename, dirname, extname } from "path"

import { useManager } from "@src/stores/useManager"
import { FileHandler } from "@src/model/FileHandler"
import { ElMessage } from "element-plus"
import { IModInfo, ISupportedGames } from "@src/model/Interfaces"
import { Manager } from "@src/model/Manager"


export class UnrealEngine {
    public static modType(bassPath: string, useUE4SS: boolean = true): ISupportedGames["modType"] {
        return [
            {
                id: 1,
                name: 'pak',
                installPath: join(bassPath, 'Content', 'Paks', 'LogicMods'),
                async install(mod) {
                    if (useUE4SS) UnrealEngine.setBPModLoaderMod()
                    return Manager.generalInstall(mod, this.installPath ?? "")
                },
                async uninstall(mod) {
                    return Manager.generalUninstall(mod, this.installPath ?? "")
                }
            },
            {
                id: 2,
                name: "UE4SS",
                installPath: join(bassPath, "Binaries", "Win64"),
                async install(mod) {
                    for (let index in mod.modFiles) {
                        const item = mod.modFiles[index];
                        if (basename(item) == 'ue4ss.dll') {
                            return Manager.installByFileSibling(mod, this.installPath ?? "", "ue4ss.dll", true)
                        }
                        if (basename(item) == 'xinput1_3.dll') {
                            return Manager.installByFileSibling(mod, this.installPath ?? "", "xinput1_3.dll", true)
                        }
                    }

                    ElMessage.warning("未找到ue4ss.dll或xinput1_3.dll, 类型可能错误, 请重新导入! ")

                    return false
                },
                async uninstall(mod) {
                    for (let index in mod.modFiles) {
                        const item = mod.modFiles[index];
                        if (basename(item) == 'ue4ss.dll') {
                            return Manager.installByFileSibling(mod, this.installPath ?? "", "ue4ss.dll", false)
                        }
                        if (basename(item) == 'xinput1_3.dll') {
                            return Manager.installByFileSibling(mod, this.installPath ?? "", "xinput1_3.dll", false)
                        }
                    }
                    ElMessage.warning("未找到ue4ss.dll或xinput1_3.dll, 类型可能错误, 请重新导入! ")

                    return false
                }
            },
            {
                id: 3,
                name: "mods",
                installPath: join(bassPath, "Binaries", "Win64", "Mods"),
                async install(mod) {
                    console.log(this.installPath);

                    return Manager.installByFolderParent(mod, this.installPath ?? "", "Enabled.txt", true)
                },
                async uninstall(mod) {
                    return Manager.installByFolderParent(mod, this.installPath ?? "", "Enabled.txt", false)
                }
            },
            {
                id: 4,
                name: "LogicMods",
                installPath: join(bassPath, "Content", "Paks", "LogicMods"),
                async install(mod) {
                    UnrealEngine.setBPModLoaderMod()
                    return Manager.generalInstall(mod, this.installPath ?? "")
                },
                async uninstall(mod) {
                    return Manager.generalUninstall(mod, this.installPath ?? "")
                }
            },
            {
                id: 5,
                name: "Scripts",
                installPath: join(bassPath, "Binaries", "Win64", "Mods"),
                async install(mod) {
                    const manage = useManager()

                    // 获取 Scripts 文件夹的父级目录
                    let parent = ""
                    for (let index in mod.modFiles) {
                        const element = mod.modFiles[index];
                        let arr = FileHandler.pathToArray(element)
                        if (arr.includes("Scripts")) {
                            parent = dirname(element)
                            break
                        }
                    }

                    let enableFile = join(manage.modStorage, mod.id.toString(), parent, "Enabled.txt")

                    // console.log(enableFile);
                    FileHandler.ensureDirectoryExistence(enableFile)


                    return Manager.installByFolderParent(mod, this.installPath ?? "", "Scripts", true)
                },
                async uninstall(mod) {
                    return Manager.installByFolderParent(mod, this.installPath ?? "", "Scripts", false)
                }
            },
            {
                id: 99,
                name: '未知',
                installPath: '\\',
                async install(mod) {
                    ElMessage.warning("该mod类型未知, 无法自动安装, 请手动安装!")
                    return false
                },
                async uninstall(mod) {
                    return true
                }
            }
        ]
    }

    static checkModType(mod: IModInfo) {
        let pak = false
        let us4ss = false
        let mods = false
        let Scripts = false

        mod.modFiles.forEach(item => {
            if (extname(item) == '.pak') pak = true
            if (FileHandler.compareFileName(item, 'Enabled.txt')) mods = true

            if (FileHandler.compareFileName(item, 'ue4ss.dll')) us4ss = true
            if (FileHandler.compareFileName(item, 'xinput1_3.dll')) us4ss = true

            // 路径中是否有 Scripts
            let arr = FileHandler.pathToArray(item)
            if (arr.includes("Scripts")) Scripts = true

        })

        if (us4ss) return 2
        if (pak) return 1
        if (mods) return 3
        if (Scripts) return 5

        return 99
    }

    public static setBPModLoaderMod() {

        const manager = useManager()

        let filepath = join(manager.gameStorage, "Pal", "Binaries", "Win64", "Mods", "mods.txt")

        // 判断文件是否存在
        if (!FileHandler.fileExists(filepath)) {
            ElMessage.warning("未找到mods.txt, 部分Mod可能不生效, 请确保您已安装 UE4SS !")
            return
        }

        // 读取文件
        let data = FileHandler.readFile(filepath, "")
        // console.log(data);

        // 将 BPModLoaderMod : 1 改为 0
        data = data.replace(/BPModLoaderMod : 0/g, "BPModLoaderMod : 1")
        // console.log(data);

        // 写入回去
        FileHandler.writeFile(filepath, data)
    }

}