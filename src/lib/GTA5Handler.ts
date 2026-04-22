import { basename, dirname, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { DotNetTool } from "@/lib/dotnet-tool";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

const RPF_TOOL_WEB_ID = 205014;
const RPF_TOOL_FILE_NAME = "rpf.dll";

const DEFAULT_ADDED_VEHICLE_MODELS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<AddedVehicleModels>
</AddedVehicleModels>`;

const DEFAULT_PEDMODELINFO_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<CPedModelInfo__InitDataList>
    <InitDatas />
</CPedModelInfo__InitDataList>`;

function getBaseNameFromPath(filePath: string) {
    return (
        filePath
            .replace(/[\\/]+/gu, "/")
            .split("/")
            .pop() ?? filePath
    );
}

function getFileExtension(filePath: string) {
    const fileName = getBaseNameFromPath(filePath);
    const dotIndex = fileName.lastIndexOf(".");

    if (dotIndex === -1) {
        return "";
    }

    return fileName.slice(dotIndex).toLowerCase();
}

function stripExtension(filePath: string) {
    const fileName = getBaseNameFromPath(filePath);
    const extension = getFileExtension(fileName);

    if (!extension) {
        return fileName;
    }

    return fileName.slice(0, -extension.length);
}

function escapeXml(value: string) {
    return value
        .replace(/&/gu, "&amp;")
        .replace(/</gu, "&lt;")
        .replace(/>/gu, "&gt;")
        .replace(/"/gu, "&quot;")
        .replace(/'/gu, "&apos;");
}

function parseXmlDocument(xmlContent: string, context: string) {
    const document = new DOMParser().parseFromString(
        xmlContent,
        "application/xml",
    );

    if (document.querySelector("parsererror")) {
        throw new Error(`${context} 解析失败。`);
    }

    return document;
}

function serializeXmlDocument(document: XMLDocument | Document) {
    const xmlBody = new XMLSerializer().serializeToString(document);
    return xmlBody.startsWith("<?xml")
        ? xmlBody
        : `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`;
}

function getFirstElementByTagName(parent: Document | Element, tagName: string) {
    return parent.getElementsByTagName(tagName).item(0);
}

function getElementTextContent(parent: Document | Element, tagName: string) {
    return getFirstElementByTagName(parent, tagName)?.textContent?.trim() ?? "";
}

async function resolveGta5Context(modId: number) {
    const modStorage = await Manager.getModStoragePath(modId);
    const { gameStorage } = await Manager.getContext();

    if (!modStorage || !gameStorage) {
        ElMessage.warning(
            "未设置当前游戏目录或 Mod 储存目录，无法处理 GTA5 模组。",
        );
        return null;
    }

    return {
        modStorage,
        gameStorage,
    };
}

export class GTA5Handler {
    private static async getToolAssemblyPath() {
        const assemblyPath = await DotNetTool.resolveManagedToolPath(
            RPF_TOOL_FILE_NAME,
            RPF_TOOL_WEB_ID,
        );

        if (!assemblyPath) {
            ElMessage.warning(
                "未找到 RPF 文件编辑工具，请先在 GTA5 管理器中安装该前置。",
            );
            return "";
        }

        return assemblyPath;
    }

    private static async getToolsDirectory() {
        const assemblyPath = await GTA5Handler.getToolAssemblyPath();

        if (!assemblyPath) {
            return "";
        }

        return dirname(assemblyPath);
    }

    private static async invokeRpf<TResult>(
        methodName: "Read" | "Write" | "Create" | "GetFiles",
        payload: unknown,
    ) {
        const assemblyPath = await GTA5Handler.getToolAssemblyPath();

        if (!assemblyPath) {
            throw new Error("未找到 RPF 文件编辑工具。");
        }

        return DotNetTool.invoke<TResult>({
            assemblyPath,
            typeName: "Rpf.Program",
            methodName,
            payload,
            runtimeMode: "isolatedDirectory",
        });
    }

    public static async getDlcName(dlcPath: string) {
        const xmlContent = await GTA5Handler.invokeRpf<string>("Read", {
            rpf: dlcPath,
            filename: "setup2.xml",
        });
        const xmlDocument = parseXmlDocument(xmlContent, "GTA5 setup2.xml");
        const nameHash = getElementTextContent(xmlDocument, "nameHash");

        if (!nameHash) {
            throw new Error("未能从 dlc.rpf 中读取 DLC 名称。");
        }

        return nameHash;
    }

    private static async setVehicleModelName(
        dlcPath: string,
        mod: IModInfo,
        isInstall: boolean,
    ) {
        const files = await GTA5Handler.invokeRpf<string[]>("GetFiles", {
            rpf: dlcPath,
        });
        const modelFiles = new Map<string, Set<string>>();

        for (const file of files ?? []) {
            const fileName = getBaseNameFromPath(file);
            const extension = getFileExtension(fileName);

            if (![".yft", ".ytd"].includes(extension)) {
                continue;
            }

            let modelName = fileName.slice(0, -extension.length);

            if (modelName.endsWith("_hi")) {
                modelName = modelName.slice(0, -3);
            }

            if (!modelFiles.has(modelName)) {
                modelFiles.set(modelName, new Set<string>());
            }

            modelFiles.get(modelName)?.add(extension);
        }

        const models = [...modelFiles.entries()]
            .filter(([, extensions]) => {
                return extensions.has(".yft") && extensions.has(".ytd");
            })
            .map(([name]) => name);

        if (models.length === 0) {
            return;
        }

        const { gameStorage } = await Manager.getContext();

        if (!gameStorage) {
            return;
        }

        const addedVehicleModelsPath = await join(
            gameStorage,
            "menyooStuff",
            "AddedVehicleModels.xml",
        );
        const xmlContent = await FileHandler.readFile(
            addedVehicleModelsPath,
            DEFAULT_ADDED_VEHICLE_MODELS_XML,
        );
        const xmlDocument = parseXmlDocument(
            xmlContent,
            "AddedVehicleModels.xml",
        );
        const rootElement = xmlDocument.documentElement;

        if (isInstall) {
            const currentNames = new Set(
                Array.from(rootElement.getElementsByTagName("VehModel")).map(
                    (item) => item.getAttribute("modelName") ?? "",
                ),
            );

            for (const model of models) {
                if (currentNames.has(model)) {
                    continue;
                }

                const vehicleModel = xmlDocument.createElement("VehModel");
                vehicleModel.setAttribute("modelName", model);
                vehicleModel.setAttribute("customName", mod.modName);
                rootElement.appendChild(vehicleModel);
            }
        } else {
            for (const vehicleModel of Array.from(
                rootElement.getElementsByTagName("VehModel"),
            )) {
                const modelName = vehicleModel.getAttribute("modelName") ?? "";

                if (models.includes(modelName)) {
                    vehicleModel.remove();
                }
            }
        }

        await FileHandler.writeFile(
            addedVehicleModelsPath,
            serializeXmlDocument(xmlDocument),
        );
    }

    private static async ensureUpdateRpf(gameStorage: string) {
        const updatePath = await join(
            gameStorage,
            "mods",
            "update",
            "update.rpf",
        );

        if (!(await FileHandler.fileExists(updatePath))) {
            await FileHandler.copyFile(
                await join(gameStorage, "update", "update.rpf"),
                updatePath,
            );
        }

        return updatePath;
    }

    public static async writeDlcName(name: string, isInstall: boolean) {
        const { gameStorage } = await Manager.getContext();

        if (!gameStorage) {
            ElMessage.warning("未设置游戏目录，无法更新 dlclist.xml。");
            return false;
        }

        const updatePath = await GTA5Handler.ensureUpdateRpf(gameStorage);
        const dlcListXmlPath = await join("common", "data", "dlclist.xml");
        const xmlContent = await GTA5Handler.invokeRpf<string>("Read", {
            rpf: updatePath,
            filename: dlcListXmlPath,
        });
        const xmlDocument = parseXmlDocument(xmlContent, "dlclist.xml");
        const pathsElement = getFirstElementByTagName(xmlDocument, "Paths");

        if (!pathsElement) {
            throw new Error("未找到 dlclist.xml 的 Paths 节点。");
        }

        const targetValue = `dlcpacks:/${name}/`;
        const items = Array.from(pathsElement.getElementsByTagName("Item"));
        const matchedItem = items.find(
            (item) => item.textContent?.trim() === targetValue,
        );

        if (isInstall) {
            if (!matchedItem) {
                const itemElement = xmlDocument.createElement("Item");
                itemElement.textContent = targetValue;
                pathsElement.appendChild(itemElement);
            }
        } else {
            matchedItem?.remove();
        }

        const toolsDirectory = await GTA5Handler.getToolsDirectory();

        if (!toolsDirectory) {
            return false;
        }

        const inputFile = await join(toolsDirectory, "dlclist.xml");
        await FileHandler.writeFile(
            inputFile,
            serializeXmlDocument(xmlDocument),
        );
        await GTA5Handler.invokeRpf("Write", {
            rpf: updatePath,
            inputFile,
            targetFile: dlcListXmlPath,
        });

        return true;
    }

    public static async dlcHandler(
        mod: IModInfo,
        installPath: string,
        isInstall: boolean,
    ) {
        const context = await resolveGta5Context(mod.id);

        if (!context) {
            return false;
        }

        for (const item of mod.modFiles) {
            if ((await basename(item)).toLowerCase() !== "dlc.rpf") {
                continue;
            }

            const sourcePath = await join(context.modStorage, item);
            const dlcName = await GTA5Handler.getDlcName(sourcePath);
            await GTA5Handler.writeDlcName(dlcName, isInstall);
            await GTA5Handler.setVehicleModelName(sourcePath, mod, isInstall);

            const targetPath = await join(
                context.gameStorage,
                installPath,
                dlcName,
                "dlc.rpf",
            );

            if (isInstall) {
                await FileHandler.copyFile(sourcePath, targetPath);
            } else {
                await FileHandler.deleteFile(targetPath);
            }
        }

        return true;
    }

    public static async buildGmm() {
        const toolsDirectory = await GTA5Handler.getToolsDirectory();
        const { gameStorage } = await Manager.getContext();

        if (!toolsDirectory || !gameStorage) {
            return false;
        }

        const outputPath = await GTA5Handler.ensureGmmDlcDirectory(gameStorage);

        await GTA5Handler.invokeRpf("Create", {
            inputFolder: await join(toolsDirectory, "gmm"),
            outputPath,
            rpfName: "dlc",
        });

        return true;
    }

    private static async ensureGmmDlcDirectory(gameStorage: string) {
        const gmmDirectory = await join(
            gameStorage,
            "mods",
            "update",
            "x64",
            "dlcpacks",
            "gmm",
        );

        // RPF 工具不会自动补齐输出目录，先创建好父目录，避免 Create 直接抛出路径不存在异常。
        await FileHandler.createDirectory(gmmDirectory);
        return gmmDirectory;
    }

    public static async initGmmRpf() {
        const { gameStorage } = await Manager.getContext();

        if (!gameStorage) {
            return false;
        }

        const gmmDirectory =
            await GTA5Handler.ensureGmmDlcDirectory(gameStorage);
        const gmmRpf = await join(gmmDirectory, "dlc.rpf");

        if (await FileHandler.fileExists(gmmRpf)) {
            return true;
        }

        return GTA5Handler.writeDlcName("gmm", true);
    }

    public static async tyfHandler(mod: IModInfo, isInstall: boolean) {
        const context = await resolveGta5Context(mod.id);
        const toolsDirectory = await GTA5Handler.getToolsDirectory();

        if (!context || !toolsDirectory) {
            return false;
        }

        await GTA5Handler.initGmmRpf();

        const targetRoot = await join(
            toolsDirectory,
            "gmm",
            "x64",
            "vehicles.rpf",
        );

        for (const item of mod.modFiles) {
            const extension = getFileExtension(item);

            if (![".yft", ".ytd"].includes(extension)) {
                continue;
            }

            const sourcePath = await join(context.modStorage, item);
            const targetPath = await join(
                targetRoot,
                getBaseNameFromPath(item),
            );

            if (isInstall) {
                await FileHandler.copyFile(sourcePath, targetPath);
            } else {
                await FileHandler.deleteFile(targetPath);
            }
        }

        await GTA5Handler.buildGmm();
        return true;
    }

    public static async gameconfig(mod: IModInfo, _isInstall: boolean) {
        const context = await resolveGta5Context(mod.id);

        if (!context) {
            return false;
        }

        const updatePath = await GTA5Handler.ensureUpdateRpf(
            context.gameStorage,
        );

        for (const item of mod.modFiles) {
            if ((await basename(item)).toLowerCase() !== "gameconfig.xml") {
                continue;
            }

            await GTA5Handler.invokeRpf("Write", {
                rpf: updatePath,
                inputFile: await join(context.modStorage, item),
                targetFile: await join("common", "data", "gameconfig.xml"),
            });
        }

        return true;
    }

    private static buildPedItemXml(
        name: string,
        mod: IModInfo,
        isMale: boolean,
    ) {
        const streamed = String(
            Boolean(mod.advanced?.data?.Streamed),
        ).toLowerCase();
        const clipDictionaryName = isMale ? "move_m@generic" : "move_f@generic";
        const expressionSetName = isMale
            ? "expr_set_ambient_male"
            : "expr_set_ambient_female";
        const pedType = isMale ? "CIVMALE" : "CIVFEMALE";
        const defaultGestureClipSet = isMale
            ? "ANIM_GROUP_GESTURE_M_GENERIC"
            : "ANIM_GROUP_GESTURE_F_GENERIC";
        const facialClipsetGroupName = isMale
            ? "facial_clipset_group_gen_male"
            : "facial_clipset_group_gen_female";
        const defaultVisemeClipSet = isMale
            ? "ANIM_GROUP_VISEMES_M_LO"
            : "ANIM_GROUP_VISEMES_F_LO";
        const poseMatcherName = isMale ? "Male" : "Female";
        const poseMatcherProneName = isMale ? "Male_prone" : "Female_prone";
        const personality = isMale ? "MERRYWEATHER" : "Streamed_Female";
        const combatInfo = isMale ? "ARMY" : "DEFAULT";

        return `<Item>
    <Name>${escapeXml(name)}</Name>
    <PropsName>null</PropsName>
    <ClipDictionaryName>${clipDictionaryName}</ClipDictionaryName>
    <BlendShapeFileName>null</BlendShapeFileName>
    <ExpressionSetName>${expressionSetName}</ExpressionSetName>
    <ExpressionDictionaryName>null</ExpressionDictionaryName>
    <ExpressionName>null</ExpressionName>
    <Pedtype>${pedType}</Pedtype>
    <MovementClipSet>${clipDictionaryName}</MovementClipSet>
    <StrafeClipSet>move_ped_strafing</StrafeClipSet>
    <MovementToStrafeClipSet>move_ped_to_strafe</MovementToStrafeClipSet>
    <InjuredStrafeClipSet>move_strafe_injured</InjuredStrafeClipSet>
    <FullBodyDamageClipSet>dam_ko</FullBodyDamageClipSet>
    <AdditiveDamageClipSet>dam_ad</AdditiveDamageClipSet>
    <DefaultGestureClipSet>${defaultGestureClipSet}</DefaultGestureClipSet>
    <FacialClipsetGroupName>${facialClipsetGroupName}</FacialClipsetGroupName>
    <DefaultVisemeClipSet>${defaultVisemeClipSet}</DefaultVisemeClipSet>
    <SidestepClipSet>CLIP_SET_ID_INVALID</SidestepClipSet>
    <PoseMatcherName>${poseMatcherName}</PoseMatcherName>
    <PoseMatcherProneName>${poseMatcherProneName}</PoseMatcherProneName>
    <GetupSetHash>NMBS_SLOW_GETUPS</GetupSetHash>
    <CreatureMetadataName>null</CreatureMetadataName>
    <DecisionMakerName>DEFAULT</DecisionMakerName>
    <MotionTaskDataSetName>STANDARD_PED</MotionTaskDataSetName>
    <DefaultTaskDataSetName>STANDARD_PED</DefaultTaskDataSetName>
    <PedCapsuleName>${isMale ? "STANDARD_MALE" : "STANDARD_FEMALE"}</PedCapsuleName>
    <PedLayoutName />
    <PedComponentSetName />
    <PedComponentClothName />
    <PedIKSettingsName />
    <TaskDataName />
    <IsStreamedGfx value="${streamed}" />
    <AmbulanceShouldRespondTo value="true" />
    <CanRideBikeWithNoHelmet value="false" />
    <CanSpawnInCar value="true" />
    <IsHeadBlendPed value="false" />
    <bOnlyBulkyItemVariations value="false" />
    <RelationshipGroup>${pedType}</RelationshipGroup>
    <NavCapabilitiesName>STANDARD_PED</NavCapabilitiesName>
    <PerceptionInfo>DEFAULT_PERCEPTION</PerceptionInfo>
    <DefaultBrawlingStyle>BS_AI</DefaultBrawlingStyle>
    <DefaultUnarmedWeapon>WEAPON_UNARMED</DefaultUnarmedWeapon>
    <Personality>${personality}</Personality>
    <CombatInfo>${combatInfo}</CombatInfo>
    <VfxInfoName>VFXPEDINFO_HUMAN_GENERIC</VfxInfoName>
    <AmbientClipsForFlee>FLEE</AmbientClipsForFlee>
    <Radio1>RADIO_GENRE_PUNK</Radio1>
    <Radio2>RADIO_GENRE_JAZZ</Radio2>
    <FUpOffset value="0.000000" />
    <RUpOffset value="0.000000" />
    <FFrontOffset value="0.000000" />
    <RFrontOffset value="0.147000" />
    <MinActivationImpulse value="20.000000" />
    <Stubble value="0.000000" />
    <HDDist value="3.000000" />
    <TargetingThreatModifier value="1.000000" />
    <KilledPerceptionRangeModifer value=" - 1.000000" />
    <Sexiness />
    <Age value="0" />
    <MaxPassengersInCar value="0" />
    <ExternallyDrivenDOFs />
    <PedVoiceGroup>BAR_PERSON_PVG</PedVoiceGroup>
    <AnimalAudioObject />
    <AbilityType>SAT_NONE</AbilityType>
    <ThermalBehaviour>TB_WARM</ThermalBehaviour>
    <SuperlodType>SLOD_HUMAN</SuperlodType>
    <ScenarioPopStreamingSlot>SCENARIO_POP_STREAMING_NORMAL</ScenarioPopStreamingSlot>
    <DefaultSpawningPreference>DSP_NORMAL</DefaultSpawningPreference>
    <DefaultRemoveRangeMultiplier value="1.000000" />
    <AllowCloseSpawning value="false" />
</Item>`;
    }

    public static async pedItem(
        name: string,
        mod: IModInfo,
        isInstall: boolean,
    ) {
        const toolsDirectory = await GTA5Handler.getToolsDirectory();

        if (!toolsDirectory) {
            return false;
        }

        const metaPath = await join(
            toolsDirectory,
            "gmm",
            "data",
            "pedmodelinfo.meta",
        );
        const xmlContent = await FileHandler.readFile(
            metaPath,
            DEFAULT_PEDMODELINFO_XML,
        );
        const xmlDocument = parseXmlDocument(xmlContent, "pedmodelinfo.meta");
        const initDatas = getFirstElementByTagName(xmlDocument, "InitDatas");

        if (!initDatas) {
            throw new Error("未找到 pedmodelinfo.meta 的 InitDatas 节点。");
        }

        for (const item of Array.from(initDatas.getElementsByTagName("Item"))) {
            if (getElementTextContent(item, "Name") === name) {
                item.remove();
            }
        }

        if (isInstall) {
            const fragmentDocument = parseXmlDocument(
                `<Root>${GTA5Handler.buildPedItemXml(name, mod, mod.advanced?.data?.sex === "Male")}</Root>`,
                "ped Item",
            );
            const itemElement =
                fragmentDocument.documentElement.firstElementChild;

            if (itemElement) {
                initDatas.appendChild(
                    xmlDocument.importNode(itemElement, true),
                );
            }
        }

        await FileHandler.writeFile(
            metaPath,
            serializeXmlDocument(xmlDocument),
        );
        return true;
    }

    public static async yddHandler(mod: IModInfo, isInstall: boolean) {
        const context = await resolveGta5Context(mod.id);
        const toolsDirectory = await GTA5Handler.getToolsDirectory();

        if (!context || !toolsDirectory) {
            return false;
        }

        await GTA5Handler.initGmmRpf();

        const targetRoot = await join(toolsDirectory, "gmm", "x64", "peds.rpf");
        const names: string[] = [];
        const selectedName = String(mod.advanced?.data?.name ?? "").trim();
        const streamedEnabled = Boolean(
            mod.advanced?.enabled && mod.advanced?.data?.Streamed,
        );

        for (const item of mod.modFiles) {
            const sourcePath = await join(context.modStorage, item);
            const isDirectory = await FileHandler.isDir(sourcePath);
            const extension = getFileExtension(item);
            const isPedFile = [".ydd", ".yft", ".yld", ".ymt", ".ytd"].includes(
                extension,
            );

            if (!isDirectory && !isPedFile) {
                continue;
            }

            if (streamedEnabled) {
                const currentName = stripExtension(item);

                if (currentName !== selectedName) {
                    continue;
                }

                names.push(selectedName);

                if (isInstall) {
                    if (isDirectory) {
                        await FileHandler.copyFolder(
                            sourcePath,
                            await join(targetRoot, getBaseNameFromPath(item)),
                        );
                    } else {
                        await FileHandler.copyFile(
                            sourcePath,
                            await join(targetRoot, getBaseNameFromPath(item)),
                        );
                    }
                } else {
                    const targetPath = await join(
                        targetRoot,
                        getBaseNameFromPath(item),
                    );

                    if (await FileHandler.isDir(targetPath)) {
                        await FileHandler.deleteFolder(targetPath);
                    } else {
                        await FileHandler.deleteFile(targetPath);
                    }
                }

                continue;
            }

            if (isDirectory) {
                continue;
            }

            names.push(stripExtension(item));

            if (isInstall) {
                await FileHandler.copyFile(
                    sourcePath,
                    await join(targetRoot, getBaseNameFromPath(item)),
                );
            } else {
                await FileHandler.deleteFile(
                    await join(targetRoot, getBaseNameFromPath(item)),
                );
            }
        }

        for (const name of [...new Set(names)]) {
            await GTA5Handler.pedItem(name, mod, isInstall);
        }

        await GTA5Handler.buildGmm();
        return true;
    }
}

async function getGTA5ModTypes(): Promise<ISupportedGames["modType"]> {
    return [
        {
            id: 1,
            name: "asi",
            installPath: "",
            async install(mod) {
                return Manager.installByFileSibling(mod, "", "asi", true, true);
            },
            async uninstall(mod) {
                return Manager.installByFileSibling(
                    mod,
                    "",
                    "asi",
                    false,
                    true,
                );
            },
        },
        {
            id: 2,
            name: "gameconfig",
            installPath: await join("gameconfig"),
            async install(mod) {
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
                return Manager.generalInstall(
                    mod,
                    this.installPath ?? "",
                    true,
                );
            },
            async uninstall(mod) {
                return Manager.generalUninstall(
                    mod,
                    this.installPath ?? "",
                    true,
                );
            },
        },
        {
            id: 4,
            name: "ScriptHookV",
            installPath: "",
            async install(mod) {
                return Manager.installByFileSibling(
                    mod,
                    this.installPath ?? "",
                    "ScriptHookV.dll",
                    true,
                );
            },
            async uninstall(mod) {
                return Manager.installByFileSibling(
                    mod,
                    this.installPath ?? "",
                    "ScriptHookV.dll",
                    false,
                );
            },
        },
        {
            id: 5,
            name: "script",
            installPath: await join("scripts"),
            async install(mod) {
                return Manager.generalInstall(
                    mod,
                    this.installPath ?? "",
                    true,
                );
            },
            async uninstall(mod) {
                return Manager.generalUninstall(
                    mod,
                    this.installPath ?? "",
                    true,
                );
            },
        },
        {
            id: 6,
            name: "dlc",
            installPath: await join("mods", "update", "x64", "dlcpacks"),
            async install(mod) {
                return GTA5Handler.dlcHandler(
                    mod,
                    this.installPath ?? "",
                    true,
                );
            },
            async uninstall(mod) {
                return GTA5Handler.dlcHandler(
                    mod,
                    this.installPath ?? "",
                    false,
                );
            },
        },
        {
            id: 7,
            name: "tyf",
            installPath: "",
            async install(mod) {
                return GTA5Handler.tyfHandler(mod, true);
            },
            async uninstall(mod) {
                return GTA5Handler.tyfHandler(mod, false);
            },
        },
        {
            id: 8,
            name: "ydd",
            installPath: await join("mods", "update", "x64", "dlcpacks"),
            async install(mod) {
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
            async install(_mod) {
                return true;
            },
            async uninstall(_mod) {
                return true;
            },
        },
        {
            id: 10,
            name: "oiv",
            installPath: "",
            async install(_mod) {
                ElMessage.warning("oiv 类型请使用 OpenIV 进行安装");
                return false;
            },
            async uninstall(_mod) {
                return true;
            },
        },
        {
            id: 99,
            name: "未知",
            installPath: "",
            async install(_mod) {
                ElMessage.warning("未知类型, 请手动安装");
                return false;
            },
            async uninstall(_mod) {
                return true;
            },
        },
    ];
}

function checkGTA5ModType(mod: IModInfo) {
    let asi = false;
    let gameconfig = false;
    let scriptHookV = false;
    let scripts = false;
    let dlc = false;
    let yft = false;
    let ydd = false;
    let oiv = false;
    let tools = false;

    for (const item of mod.modFiles) {
        const fileName = getBaseNameFromPath(item).toLowerCase();
        const extension = getFileExtension(item);

        if (extension === ".asi") asi = true;
        if (extension === ".dll") scripts = true;
        if (fileName === "gameconfig.xml") gameconfig = true;
        if (fileName === "scripthookv.dll") scriptHookV = true;
        if (fileName === "dlc.rpf") dlc = true;
        if (extension === ".yft") yft = true;
        if (extension === ".ydd") ydd = true;
        if (extension === ".oiv") oiv = true;
        if (fileName === "rpf.dll") tools = true;
    }

    if (scriptHookV) return 4;
    if (tools) return 9;
    if (asi) return 1;
    if (gameconfig) return 2;
    if (scripts) return 5;
    if (dlc) return 6;
    if (ydd) return 8;
    if (yft) return 7;
    if (oiv) return 10;

    return 99;
}

export const supportedGamesGTA5 = async () =>
    ({
        GlossGameId: 261,
        steamAppID: 271590,
        nexusMods: {
            game_domain_name: "gta5",
            game_id: 893,
        },
        installdir: await join("Grand Theft Auto V"),
        gameName: "Grand Theft Auto V",
        gameExe: [
            {
                rootPath: ["."],
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
                exePath: await join("PlayGTAV.exe"),
            },
        ],
        archivePath: await join(
            await FileHandler.getMyDocuments(),
            "Rockstar Games",
            "GTA V",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/616cd448533b9.png",
        modType: await getGTA5ModTypes(),
        checkModType: checkGTA5ModType,
    }) as ISupportedGames;

export const supportedGamesGTA5Enhanced = async () =>
    ({
        GlossGameId: 475,
        steamAppID: 3240220,
        nexusMods: {
            game_domain_name: "gta5enhanced",
            game_id: 7627,
        },
        installdir: await join("Grand Theft Auto V Enhanced"),
        gameName: "Grand Theft Auto V Enhanced",
        gameExe: [
            {
                rootPath: ["."],
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
                exePath: await join("PlayGTAV.exe"),
            },
        ],
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/logo/croppedImg_692fc8cd5ea06.png",
        modType: await getGTA5ModTypes(),
        checkModType: checkGTA5ModType,
    }) as ISupportedGames;
