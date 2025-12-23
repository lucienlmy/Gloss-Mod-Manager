import { basename, join, extname } from "node:path";
import convert from "xml-js";
import { ElMessage } from "element-plus";
import { useManager } from "@/stores/useManager";
import { FileHandler } from "@/model/FileHandler";
import { Manager } from "@/model/Manager";

export class GTA5Handler {
    /**
     * 调用 RPF 文件编辑工具的方法
     * @param methodName 操作类型 ("Read" | "Write" | "Create")
     * @param arg 参数对象
     * @returns Promise<any> 操作结果
     */
    public static RpfHeader(methodName: "Read" | "Write" | "Create", arg: any) {
        const edge = require("electron-edge-js-39-only");
        let assemblyFile = join(GTA5Handler.getToolsPath(), "rpf.dll");

        let Invoke = edge.func({
            assemblyFile: assemblyFile,
            typeName: "Rpf.Program",
            methodName: methodName,
        });
        return new Promise<any>((resolve, reject) => {
            Invoke(arg, (error: any, result: any) => {
                if (error) {
                    console.log(error);
                    reject(error);
                } else resolve(result);
            }).finally(() => {
                // 释放资源
                Invoke = null;
            });
        });
    }

    /**
     * 获取 RPF 工具的路径
     * @returns string 工具路径
     */
    public static getToolsPath() {
        const manager = useManager();
        const tools = manager.getModInfoByWebId(205014);
        return join(manager.modStorage, tools?.id.toString() ?? "");
    }

    /**
     * 从 DLC 文件中获取 DLC 名称
     * @param dlc DLC 文件路径
     * @returns Promise<string> DLC 名称
     */
    public static async GetDlcName(dlc: string) {
        const data = await GTA5Handler.RpfHeader("Read", {
            rpf: dlc,
            filename: "setup2.xml",
        });
        const xmlData: convert.ElementCompact = convert.xml2js(data, {
            compact: true,
        });
        return xmlData.SSetupData.nameHash._text;
    }

    /**
     * 获取车辆模型名称
     * @param dlc
     */
    public static async GetVehModelName(dlc: string) {
        /** dlc.rpf\x64\vehicles.rpf
         *  |- bolide.yft
         *  |- bolide.ytd
         *  |- bolide_hi.yft
         *  那么车辆模型名称就是 bolide
         *  根据这个规律来获取车辆模型名称
         */
        const data = await GTA5Handler.RpfHeader("Read", {
            rpf: dlc,
            filename: "x64/vehicles.rpf",
        });
    }

    /**
     * 在 dlclist.xml 中添加或移除 DLC 名称
     * @param name DLC 名称
     * @param isInstall 是否为安装操作
     */
    public static async writeDlcName(name: string, isInstall: boolean) {
        const manager = useManager();

        const update_path = join(
            manager.gameStorage,
            "mods",
            "update",
            "update.rpf"
        );
        // 判断文件是否存在
        if (!FileHandler.fileExists(update_path)) {
            // 在 mods 中创建 update.rpf 文件
            await FileHandler.copyFile(
                join(manager.gameStorage, "update", "update.rpf"),
                update_path
            );
        }

        // D:\SteamLibrary\steamapps\common\Grand Theft Auto V\update\update.rpf\common\data\dlclist.xml
        const dlclistXml = join("common", "data", "dlclist.xml");
        const xml = await GTA5Handler.RpfHeader("Read", {
            rpf: update_path,
            filename: dlclistXml,
        });
        const dlclist: convert.ElementCompact = convert.xml2js(xml, {
            compact: true,
        });

        console.log(dlclist);

        if (isInstall) {
            // 判断 `dlcpacks:/${name}/` 是否存在, 不存在 则添加
            if (
                !(dlclist.SMandatoryPacksData.Paths.Item as any[]).some(
                    (item: any) => item._text == `dlcpacks:/${name}/`
                )
            ) {
                dlclist.SMandatoryPacksData.Paths.Item.push({
                    _text: `dlcpacks:/${name}/`,
                });
            }
        } else {
            dlclist.SMandatoryPacksData.Paths.Item =
                dlclist.SMandatoryPacksData.Paths.Item.filter((item: any) => {
                    return item._text != `dlcpacks:/${name}/`;
                });
        }
        const data = convert.js2xml(dlclist, { compact: true, spaces: 4 });

        if (data) {
            const inputFile = join(GTA5Handler.getToolsPath(), "dlclist.xml");
            await FileHandler.writeFile(inputFile, data);

            const res = await GTA5Handler.RpfHeader("Write", {
                rpf: update_path,
                inputFile: inputFile,
                targetFile: dlclistXml,
            });
        }
    }

    /**
     * 处理 DLC 模组的安装和卸载
     * @param mod 模组信息
     * @param installPath 安装路径
     * @param isInstall 是否为安装操作
     * @returns Promise<boolean> 操作结果
     */
    public static async dlcHandler(
        mod: IModInfo,
        installPath: string,
        isInstall: boolean
    ) {
        let manager = useManager();
        let modStorage = join(manager.modStorage, mod.id.toString());
        let gameStorage = join(manager.gameStorage ?? "");

        for (let index in mod.modFiles) {
            const item = mod.modFiles[index];
            if (basename(item) == "dlc.rpf") {
                let name = await GTA5Handler.GetDlcName(join(modStorage, item));
                await GTA5Handler.writeDlcName(name, isInstall);
                if (isInstall) {
                    FileHandler.copyFile(
                        join(modStorage, item),
                        join(gameStorage, installPath, name, "dlc.rpf")
                    );
                } else {
                    FileHandler.deleteFile(
                        join(gameStorage, installPath, name, "dlc.rpf")
                    );
                }
            }
        }

        return true;
    }

    /**
     * 构建 GMM DLC 文件
     */
    public static buidGmm() {
        const manager = useManager();
        const gameStorage = join(manager.gameStorage ?? "");

        // 如果不存在 则生成
        // let dlcpacks_path = join(gameStorage, "mods", "update", "x64", "dlcpacks")
        // const cmd = `"${join(getToolsPath(), "_buidGMM.bat")}" "${dlcpacks_path}"`
        // // console.log(cmd);
        // execSync(cmd, { encoding: 'utf8' }).toString()
        const inputFolder = join(GTA5Handler.getToolsPath(), "gmm");
        const outputPath = join(
            gameStorage,
            "mods",
            "update",
            "x64",
            "dlcpacks",
            "gmm"
        );
        const rpfName = "dlc";
        GTA5Handler.RpfHeader("Create", { inputFolder, outputPath, rpfName });
    }

    /**
     * 初始化 GMM RPF 文件
     */
    public static initGmm_rpf() {
        const manager = useManager();
        const gameStorage = join(manager.gameStorage ?? "");

        // 判断 gmm 的 dlc.rpf 是否存在
        const gmm_rpf = join(
            gameStorage,
            "mods",
            "update",
            "x64",
            "dlcpacks",
            "gmm",
            "dlc.rpf"
        );
        if (FileHandler.fileExists(gmm_rpf)) {
            //如果存在 则跳过
            // console.log("gmm 的 dlc.rpf 已存在");
            return;
        }
        // buidGmm();
        GTA5Handler.writeDlcName("gmm", true);
    }

    /**
     * 处理 TYF 载具模组的安装和卸载
     * @param mod 模组信息
     * @param isInstall 是否为安装操作
     * @returns Promise<boolean> 操作结果
     */
    public static async tyfHandler(mod: IModInfo, isInstall: boolean) {
        GTA5Handler.initGmm_rpf();
        const manager = useManager();

        const target = join(
            GTA5Handler.getToolsPath(),
            "gmm",
            "x64",
            "vehicles.rpf"
        );

        for (let index = 0; index < mod.modFiles.length; index++) {
            const item = mod.modFiles[index];
            let types = [".yft", ".ytd"];
            // 判断文件后缀是否是 types
            if (types.includes(extname(item))) {
                // 如果是 则复制到 gmm 的 dlc.rpf
                if (isInstall) {
                    await FileHandler.copyFile(
                        join(manager.modStorage, mod.id.toString(), item),
                        join(target, basename(item))
                    );
                } else {
                    await FileHandler.deleteFile(join(target, basename(item)));
                }
            }
        }

        // 生成 gmm 的 dlc.rpf
        GTA5Handler.buidGmm();

        return true;
    }

    /**
     * 处理游戏配置文件模组的安装和卸载
     * @param mod 模组信息
     * @param isInstall 是否为安装操作
     * @returns Promise<boolean> 操作结果
     */
    public static async gameconfig(mod: IModInfo, isInstall: boolean) {
        const manager = useManager();

        const update_path = join(
            manager.gameStorage,
            "mods",
            "update",
            "update.rpf"
        );
        // 判断文件是否存在
        if (!FileHandler.fileExists(update_path)) {
            // 在 mods 中创建 update.rpf 文件
            await FileHandler.copyFile(
                join(manager.gameStorage, "update", "update.rpf"),
                update_path
            );
        }

        mod.modFiles.forEach((item) => {
            if (basename(item) == "gameconfig.xml") {
                const rpf = update_path;
                const inputFile = join(
                    manager.modStorage,
                    mod.id.toString(),
                    item
                );
                const targetFile = join("common", "data", "gameconfig.xml");

                GTA5Handler.RpfHeader("Write", { rpf, inputFile, targetFile });
            }
        });

        return true;
    }

    /**
     * 创建人物 XML 配置对象
     * @private
     * @param name 人物名称
     * @param mod 模组信息
     * @param isMale 是否为男性
     * @returns 人物 XML 配置对象
     */
    private static createPedXml(name: string, mod: IModInfo, isMale: boolean) {
        const baseXml = {
            Name: {
                _text: name,
            },
            PropsName: {
                _text: "null",
            },
            ClipDictionaryName: {
                _text: isMale ? "move_m@generic" : "move_f@generic",
            },
            BlendShapeFileName: {
                _text: "null",
            },
            ExpressionSetName: {
                _text: isMale
                    ? "expr_set_ambient_male"
                    : "expr_set_ambient_female",
            },
            ExpressionDictionaryName: {
                _text: "null",
            },
            ExpressionName: {
                _text: "null",
            },
            Pedtype: {
                _text: isMale ? "CIVMALE" : "CIVFEMALE",
            },
            MovementClipSet: {
                _text: isMale ? "move_m@generic" : "move_f@generic",
            },
            StrafeClipSet: {
                _text: "move_ped_strafing",
            },
            MovementToStrafeClipSet: {
                _text: "move_ped_to_strafe",
            },
            InjuredStrafeClipSet: {
                _text: "move_strafe_injured",
            },
            FullBodyDamageClipSet: {
                _text: "dam_ko",
            },
            AdditiveDamageClipSet: {
                _text: "dam_ad",
            },
            DefaultGestureClipSet: {
                _text: isMale
                    ? "ANIM_GROUP_GESTURE_M_GENERIC"
                    : "ANIM_GROUP_GESTURE_F_GENERIC",
            },
            FacialClipsetGroupName: {
                _text: isMale
                    ? "facial_clipset_group_gen_male"
                    : "facial_clipset_group_gen_female",
            },
            DefaultVisemeClipSet: {
                _text: isMale
                    ? "ANIM_GROUP_VISEMES_M_LO"
                    : "ANIM_GROUP_VISEMES_F_LO",
            },
            SidestepClipSet: {
                _text: "CLIP_SET_ID_INVALID",
            },
            PoseMatcherName: {
                _text: isMale ? "Male" : "Female",
            },
            PoseMatcherProneName: {
                _text: isMale ? "Male_prone" : "Female_prone",
            },
            GetupSetHash: {
                _text: "NMBS_SLOW_GETUPS",
            },
            CreatureMetadataName: {
                _text: "null",
            },
            DecisionMakerName: {
                _text: "DEFAULT",
            },
            MotionTaskDataSetName: {
                _text: "STANDARD_PED",
            },
            DefaultTaskDataSetName: {
                _text: "STANDARD_PED",
            },
            PedCapsuleName: {
                _text: isMale ? "STANDARD_MALE" : "STANDARD_FEMALE",
            },
            PedLayoutName: {},
            PedComponentSetName: {},
            PedComponentClothName: {},
            PedIKSettingsName: {},
            TaskDataName: {},
            IsStreamedGfx: {
                _attributes: {
                    value: mod.advanced?.data.Streamed ? "true" : "false",
                },
            },
            AmbulanceShouldRespondTo: {
                _attributes: {
                    value: "true",
                },
            },
            CanRideBikeWithNoHelmet: {
                _attributes: {
                    value: "false",
                },
            },
            CanSpawnInCar: {
                _attributes: {
                    value: "true",
                },
            },
            IsHeadBlendPed: {
                _attributes: {
                    value: "false",
                },
            },
            bOnlyBulkyItemVariations: {
                _attributes: {
                    value: "false",
                },
            },
            RelationshipGroup: {
                _text: isMale ? "CIVMALE" : "CIVFEMALE",
            },
            NavCapabilitiesName: {
                _text: "STANDARD_PED",
            },
            PerceptionInfo: {
                _text: "DEFAULT_PERCEPTION",
            },
            DefaultBrawlingStyle: {
                _text: "BS_AI",
            },
            DefaultUnarmedWeapon: {
                _text: "WEAPON_UNARMED",
            },
            Personality: {
                _text: isMale ? "MERRYWEATHER" : "Streamed_Female",
            },
            CombatInfo: {
                _text: isMale ? "ARMY" : "DEFAULT",
            },
            VfxInfoName: {
                _text: "VFXPEDINFO_HUMAN_GENERIC",
            },
            AmbientClipsForFlee: {
                _text: "FLEE",
            },
            Radio1: {
                _text: "RADIO_GENRE_PUNK",
            },
            Radio2: {
                _text: "RADIO_GENRE_JAZZ",
            },
            FUpOffset: {
                _attributes: {
                    value: "0.000000",
                },
            },
            RUpOffset: {
                _attributes: {
                    value: "0.000000",
                },
            },
            FFrontOffset: {
                _attributes: {
                    value: "0.000000",
                },
            },
            RFrontOffset: {
                _attributes: {
                    value: "0.147000",
                },
            },
            MinActivationImpulse: {
                _attributes: {
                    value: "20.000000",
                },
            },
            Stubble: {
                _attributes: {
                    value: "0.000000",
                },
            },
            HDDist: {
                _attributes: {
                    value: "3.000000",
                },
            },
            TargetingThreatModifier: {
                _attributes: {
                    value: "1.000000",
                },
            },
            KilledPerceptionRangeModifer: {
                _attributes: {
                    value: " - 1.000000",
                },
            },
            Sexiness: {},
            Age: {
                _attributes: {
                    value: "0",
                },
            },
            MaxPassengersInCar: {
                _attributes: {
                    value: "0",
                },
            },
            ExternallyDrivenDOFs: {},
            PedVoiceGroup: {
                _text: "BAR_PERSON_PVG",
            },
            AnimalAudioObject: {},
            AbilityType: {
                _text: "SAT_NONE",
            },
            ThermalBehaviour: {
                _text: "TB_WARM",
            },
            SuperlodType: {
                _text: "SLOD_HUMAN",
            },
            ScenarioPopStreamingSlot: {
                _text: "SCENARIO_POP_STREAMING_NORMAL",
            },
            DefaultSpawningPreference: {
                _text: "DSP_NORMAL",
            },
            DefaultRemoveRangeMultiplier: {
                _attributes: {
                    value: "1.000000",
                },
            },
            AllowCloseSpawning: {
                _attributes: {
                    value: "false",
                },
            },
        };
        return baseXml;
    }

    /**
     * 处理人物项目的安装和卸载
     * @param name 人物名称
     * @param mod 模组信息
     * @param isInstall 是否为安装操作
     */
    public static async pedItem(
        name: string,
        mod: IModInfo,
        isInstall: boolean
    ) {
        const isMale = mod.advanced?.data.sex === "Male";
        const xmlData = GTA5Handler.createPedXml(name, mod, isMale);

        const manager = useManager();
        const tools = manager.getModInfoByWebId(205014);
        const tools_path = join(manager.modStorage, tools?.id.toString() ?? "");

        const meta_path = join(tools_path, "gmm", "data", "pedmodelinfo.meta");

        let metaData = FileHandler.readFile(
            meta_path,
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<CPedModelInfo__InitDataList>
    <InitDatas />
</CPedModelInfo__InitDataList>`
        );

        const PedModelInfo: convert.ElementCompact = convert.xml2js(metaData, {
            compact: true,
        });
        console.log(PedModelInfo);
        console.log(xmlData);

        if (!PedModelInfo.CPedModelInfo__InitDataList.InitDatas.Item) {
            PedModelInfo.CPedModelInfo__InitDataList.InitDatas.Item = [];
        }

        if (
            !Array.isArray(
                PedModelInfo.CPedModelInfo__InitDataList.InitDatas.Item
            )
        ) {
            PedModelInfo.CPedModelInfo__InitDataList.InitDatas.Item = [
                PedModelInfo.CPedModelInfo__InitDataList.InitDatas.Item,
            ];
        }

        if (isInstall) {
            PedModelInfo.CPedModelInfo__InitDataList.InitDatas.Item.push(
                xmlData
            );
        } else {
            PedModelInfo.CPedModelInfo__InitDataList.InitDatas.Item =
                PedModelInfo.CPedModelInfo__InitDataList.InitDatas.Item.filter(
                    (item: any) => {
                        return item.Name._text != name;
                    }
                );
        }

        const data = convert.js2xml(PedModelInfo, { compact: true, spaces: 4 });
        if (data) {
            // console.log(PedModelInfo);
            FileHandler.writeFile(meta_path, data);
        }
    }

    /**
     * 处理 YDD 人物模组的安装和卸载
     * @param mod 模组信息
     * @param isInstall 是否为安装操作
     * @returns Promise<boolean> 操作结果
     */
    public static async yddHandler(mod: IModInfo, isInstall: boolean) {
        GTA5Handler.initGmm_rpf();
        const manager = useManager();
        let names = [];

        const target = join(
            GTA5Handler.getToolsPath(),
            "gmm",
            "x64",
            "peds.rpf"
        );
        for (let index in mod.modFiles) {
            const item = mod.modFiles[index];
            let types = [".ydd", ".yft", ".yld", ".ymt", ".ytd"];
            let source = join(manager.modStorage, mod.id.toString(), item);

            if (types.includes(extname(item)) || FileHandler.isDir(source)) {
                if (mod.advanced?.enabled && mod.advanced.data.Streamed) {
                    // 如果是组合式
                    if (
                        basename(item, extname(item)) == mod.advanced.data.name
                    ) {
                        names.push(mod.advanced.data.name);
                        if (isInstall) {
                            if (FileHandler.isDir(source)) {
                                await FileHandler.copyFolder(
                                    source,
                                    join(target, basename(item))
                                );
                            } else {
                                await FileHandler.copyFile(
                                    source,
                                    join(target, basename(item))
                                );
                            }
                        } else {
                            if (
                                FileHandler.isDir(join(target, basename(item)))
                            ) {
                                await FileHandler.deleteFolder(
                                    join(target, basename(item))
                                );
                            } else {
                                await FileHandler.deleteFile(
                                    join(target, basename(item))
                                );
                            }
                        }
                    }
                } else {
                    // 如果不是组合式
                    names.push(basename(item, extname(item)));
                    if (!FileHandler.isDir(source)) {
                        if (isInstall) {
                            await FileHandler.copyFile(
                                source,
                                join(target, basename(item))
                            );
                        } else {
                            await FileHandler.deleteFile(
                                join(target, basename(item))
                            );
                        }
                    }
                }
            }
        }

        // name 去重
        names = [...new Set(names)];
        for (let index = 0; index < names.length; index++) {
            const item = names[index];
            await GTA5Handler.pedItem(item, mod, isInstall);
        }

        GTA5Handler.buidGmm();

        return true;
    }
}

/**
 * GTA5 模组类型定义数组
 */
const GTA5ModTypes: ISupportedGames["modType"] = [
    {
        id: 1,
        name: "asi",
        installPath: join(""),
        async install(mod) {
            return Manager.installByFileSibling(mod, "", ".asi", true, true);
        },
        async uninstall(mod) {
            return Manager.installByFileSibling(mod, "", ".asi", false, true);
        },
    },
    {
        id: 2,
        name: "gameconfig",
        installPath: join("gameconfig"),
        async install(mod) {
            if (!Manager.checkInstalled("RPF 文件编辑工具", 205014))
                return false;
            return GTA5Handler.gameconfig(mod, true);
        },
        async uninstall(mod) {
            return GTA5Handler.gameconfig(mod, false);
        },
    },
    {
        id: 3,
        name: "游戏根目录",
        installPath: "",
        async install(mod) {
            return Manager.generalInstall(mod, this.installPath ?? "", true);
        },
        async uninstall(mod) {
            return Manager.generalUninstall(mod, this.installPath ?? "", true);
        },
    },
    {
        id: 4,
        name: "ScriptHookV",
        installPath: "",
        async install(mod) {
            // ScriptHookV.dll
            return Manager.installByFileSibling(
                mod,
                this.installPath ?? "",
                "ScriptHookV.dll",
                true
            );
        },
        async uninstall(mod) {
            return Manager.installByFileSibling(
                mod,
                this.installPath ?? "",
                "ScriptHookV.dll",
                false
            );
        },
    },
    {
        id: 5,
        name: "script",
        installPath: join("scripts"),
        async install(mod) {
            return Manager.generalInstall(mod, this.installPath ?? "", true);
        },
        async uninstall(mod) {
            return Manager.generalUninstall(mod, this.installPath ?? "", true);
        },
    },
    {
        id: 6,
        name: "dlc", // 添加式
        installPath: join("mods", "update", "x64", "dlcpacks"),
        async install(mod) {
            if (!Manager.checkInstalled("RPF 文件编辑工具", 205014))
                return false;
            return GTA5Handler.dlcHandler(mod, this.installPath ?? "", true);
        },
        async uninstall(mod) {
            return GTA5Handler.dlcHandler(mod, this.installPath ?? "", false);
        },
    },
    {
        id: 7,
        name: "tyf", // 载具替换式
        installPath: join(""),
        async install(mod) {
            if (!Manager.checkInstalled("RPF 文件编辑工具", 205014))
                return false;
            return GTA5Handler.tyfHandler(mod, true);
        },
        async uninstall(mod) {
            return GTA5Handler.tyfHandler(mod, false);
        },
    },
    {
        id: 8,
        name: "ydd", // 人物
        installPath: join("mods", "update", "x64", "dlcpacks"),
        async install(mod) {
            if (!Manager.checkInstalled("RPF 文件编辑工具", 205014))
                return false;
            return GTA5Handler.yddHandler(mod, true);
        },
        async uninstall(mod) {
            return GTA5Handler.yddHandler(mod, false);
        },
        advanced: {
            name: "配置",
            icon: "mdi-align-horizontal-center",
            item: [
                {
                    type: "selects",
                    label: "角色性别",
                    key: "sex",
                    selectItem: [
                        { name: "男", value: "Male" },
                        { name: "女", value: "Female" },
                    ],
                    defaultValue: "Female",
                },
                {
                    type: "switch",
                    label: "组合",
                    key: "Streamed",
                },
            ],
        },
    },
    {
        id: 9,
        name: "tools",
        installPath: "",
        async install(mod) {
            return true;
        },
        async uninstall(mod) {
            return true;
        },
    },
    {
        id: 10,
        name: "oiv",
        installPath: "",
        async install(mod) {
            ElMessage.warning("oiv 类型请使用 OpenIV 进行安装");
            return false;
        },
        async uninstall(mod) {
            return true;
        },
    },
    {
        id: 99,
        name: "未知",
        installPath: "",
        async install(mod) {
            ElMessage.warning("未知类型, 请手动安装");
            return false;
        },
        async uninstall(mod) {
            return true;
        },
    },
];

/**
 * 检查 GTA5 模组类型
 * @param mod 模组信息
 * @returns number 模组类型 ID
 */
function checkGTA5ModType(mod: IModInfo): number {
    let asi = false;
    // let rootFolder = false
    // let folderList = ['x64']
    let gameconfig = false;
    let ScriptHookRDR2 = false;
    let scripts = false;
    let dlc = false;
    let yft = false;
    let ydd = false;
    let oiv = false;
    let tools = false;

    mod.modFiles.forEach((item) => {
        // 判断目录是否包含 folderList
        let list = FileHandler.pathToArray(item);
        // if (list.some(item => folderList.includes(item))) rootFolder = true

        if (extname(item) == ".asi") asi = true;
        if (extname(item) == ".dll") scripts = true;
        if (basename(item) == "gameconfig.xml") gameconfig = true;
        if (basename(item) == "ScriptHookV.dll") ScriptHookRDR2 = true;
        if (basename(item) == "dlc.rpf") dlc = true;
        if (extname(item) == ".yft") yft = true;
        if (extname(item) == ".ydd") ydd = true;
        if (extname(item) == ".oiv") oiv = true;
        if (basename(item) == "rpf.dll") tools = true;
    });

    if (ScriptHookRDR2) return 4;

    if (tools) return 9;

    if (asi) return 1;
    if (gameconfig) return 2;
    // if (rootFolder) return 3
    if (scripts) return 5;
    if (dlc) return 6;
    if (ydd) return 8;
    if (yft) return 7;
    if (oiv) return 10;

    return 99;
}

/**
 * GTA5 游戏支持配置
 */
export const supportedGamesGTA5: ISupportedGames = {
    GlossGameId: 261,
    steamAppID: 271590,
    nexusMods: {
        game_domain_name: "gta5",
        game_id: 893,
    },
    installdir: join("Grand Theft Auto V"),
    gameName: "Grand Theft Auto V",
    gameExe: [
        {
            rootPath: ".",
            name: "GTA5.exe",
        },
    ],
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/271590",
        },
        {
            name: "直接启动",
            exePath: join("PlayGTAV.exe"),
        },
    ],
    archivePath: join(FileHandler.getMyDocuments(), "Rockstar Games", "GTA V"),
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/game/616cd448533b9.png",
    modType: GTA5ModTypes,
    checkModType: checkGTA5ModType,
};

/**
 * GTA5 Enhanced 游戏支持配置
 */
export const supportedGamesGTA5Enhanced: ISupportedGames = {
    GlossGameId: 475,
    steamAppID: 3240220,
    nexusMods: {
        game_domain_name: "gta5enhanced",
        game_id: 7627,
    },
    installdir: join("Grand Theft Auto V Enhanced"),
    gameName: "Grand Theft Auto V Enhanced",
    gameExe: [
        {
            rootPath: ".",
            name: "GTA5_Enhanced.exe",
        },
    ],
    startExe: [
        {
            name: "Steam 启动",
            cmd: "steam://rungameid/3240220",
        },
        {
            name: "直接启动",
            exePath: join("PlayGTAV.exe"),
        },
    ],
    gameCoverImg:
        "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_692fc8cd5ea06.png",
    modType: GTA5ModTypes,
    checkModType: checkGTA5ModType,
};
