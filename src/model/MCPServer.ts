import {
    McpServer,
    ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import path from "path";
import express from "express";

import { z } from "zod";
import { getLangAll } from "@/lang";

export class MCPServer {
    public server = new McpServer({
        name: "gloss-mod-manager",
        version: "1.0.0",
    });

    public app = express();

    private httpServer: any = null;

    private isRunning: boolean = false;

    private statusCallback: ((running: boolean) => void) | null = null;

    private navigationCallback:
        | ((routeName: string, routeParams?: any) => void)
        | null = null;

    constructor() {}

    public setStatusCallback(callback: (running: boolean) => void) {
        this.statusCallback = callback;
    }

    public setNavigationCallback(
        callback: (routeName: string, routeParams?: any) => void
    ) {
        this.navigationCallback = callback;
    }

    public getIsRunning(): boolean {
        return this.isRunning;
    }

    public start(port: number) {
        this.registerTool();
        this.registerResource();
        this.registerPrompt();
        this.app.use(express.json());
        this.app.post("/mcp", async (req, res) => {
            // Create a new transport for each request to prevent request ID collisions
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
                enableJsonResponse: true,
            });

            res.on("close", () => {
                transport.close();
            });

            await this.server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        });

        this.httpServer = this.app.listen(port, () => {
            this.isRunning = true;
            this.statusCallback?.(true);
            console.log(`MCP Server running on http://localhost:${port}/mcp`);
            ElMessage.success(
                `MCP Server 已启动在 http://localhost:${port}/mcp`
            );
        });
    }

    public stop() {
        if (this.httpServer) {
            this.httpServer.close(() => {
                this.isRunning = false;
                this.statusCallback?.(false);
                console.log("MCP Server stopped");
            });
        }
    }

    private registerTool() {
        //#region 获取支持的游戏列表
        this.server.registerTool(
            "get-supported-games-list",
            {
                title: "Get Supported Games List",
                description: "获取支持的游戏列表",
                outputSchema: {
                    games: z.array(z.object({})),
                    count: z.number(),
                },
            },
            async () => {
                const manager = useManager();
                const gamesList: ISupportedGames[] = JSON.parse(
                    JSON.stringify(manager.supportedGames)
                );
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                games: gamesList,
                                count: gamesList.length,
                            }),
                        },
                    ],
                    structuredContent: {
                        games: gamesList,
                        count: gamesList.length,
                    },
                };
            }
        );
        //#endregion

        //#region 从管理器中获取所有已管理的游戏列表
        this.server.registerTool(
            "get-manager-games-list",
            {
                title: "Get Managed Games List",
                description: "从管理器中获取所有已管理的游戏列表",
                // inputSchema: {
                //     weightKg: z.number(),
                //     heightM: z.number(),
                // },
                outputSchema: {
                    games: z.array(z.object({})),
                    count: z.number(),
                },
            },
            async () => {
                const settings = useSettings();
                const gamesList: ISupportedGames[] = JSON.parse(
                    JSON.stringify(settings.settings.managerGameList)
                );
                const output = { games: gamesList, count: gamesList.length };
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(output),
                        },
                    ],
                    structuredContent: output,
                };
            }
        );
        //#endregion

        //#region 翻译游戏名称
        this.server.registerTool(
            "translate-game-name",
            {
                title: "Game Name Translator",
                description: "将游戏名称翻译成用户使用的语言",
                inputSchema: { gameName: z.string() },
                outputSchema: {
                    translatedName: z.string(),
                },
            },
            async ({ gameName }) => {
                // 调用 i18n 进行翻译
                const i18n = useI18n();
                const translatedName = i18n.t(gameName) as string;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ translatedName }),
                        },
                    ],
                    structuredContent: { translatedName },
                };
            }
        );
        //#endregion

        //#region 切换管理的游戏
        this.server.registerTool(
            "switch-managed-game",
            {
                title: "Switch Managed Game",
                description: "切换当前管理的游戏",
                inputSchema: { GlossGameId: z.number() },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ GlossGameId }) => {
                const settings = useSettings();
                const manager = useManager();

                let sgame = manager.supportedGames.find(
                    (item) => item.GlossGameId == GlossGameId
                );
                if (sgame) {
                    const item = settings.settings.managerGameList.find(
                        (g) => g.GlossGameId == GlossGameId
                    );
                    AppAnalytics.sendEvent(`switch_game`, sgame?.gameName);
                    settings.settings.managerGame = {
                        ...item,
                        ...sgame,
                    };
                    // 使用导航回调而不是直接调用 router.push
                    this.navigationCallback?.("Manager");
                    return {
                        content: [
                            {
                                type: "text",
                                text: `成功切换到游戏: ${sgame.gameName}`,
                            },
                        ],
                        structuredContent: {
                            state: true,
                            message: `成功切换到游戏: ${sgame.gameName}`,
                        },
                    };
                } else {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `未找到ID 为 ${GlossGameId} 的游戏`,
                            },
                        ],
                        structuredContent: { state: false },
                    };
                }
            }
        );
        //#endregion

        //#region 获取当前管理的游戏
        this.server.registerTool(
            "get-current-managed-game",
            {
                title: "Get Current Managed Game",
                description: "获取当前正在管理的游戏信息",
                outputSchema: {
                    game: z.object({
                        GlossGameId: z.number(),
                        gameName: z.string(),
                        gamePath: z.string(),
                    }),
                },
            },
            async () => {
                const settings = useSettings();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                game: settings.settings.managerGame,
                            }),
                        },
                    ],
                    structuredContent: { game: settings.settings.managerGame },
                };
            }
        );
        //#endregion

        //#region 从steam获取已安装的游戏
        this.server.registerTool(
            "fetch-steam-installed-games",
            {
                title: "Fetch Steam Installed Games",
                description: "从Steam获取已安装的游戏",
                outputSchema: {
                    games: z.array(
                        z.object({
                            id: z.number(),
                            name: z.string(),
                            path: z.string(),
                        })
                    ),
                },
            },
            async () => {
                const steamGames = Steam.getSteamGameList();
                // 将返回的数据转换为符合 schema 的格式
                const games = steamGames.map((game) => {
                    return {
                        id: game.appid,
                        name: game.name,
                        path: game.path,
                    };
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                games,
                            }),
                        },
                    ],
                    structuredContent: { games },
                };
            }
        );
        //#endregion

        //#region 将游戏添加到 管理器
        this.server.registerTool(
            "add-game-to-manager",
            {
                title: "Add Game to Manager",
                description: "将游戏添加到管理器",
                inputSchema: {
                    GlossGameId: z.number(),
                    gamePath: z.string(),
                },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ GlossGameId, gamePath }) => {
                const manager = useManager();
                const settings = useSettings();

                const gameItem = manager.supportedGames.find(
                    (g) => g.GlossGameId == GlossGameId
                );

                if (gameItem) {
                    settings.settings.managerGame = gameItem;
                    settings.settings.managerGame.gamePath = gamePath;
                    manager.getModInfo();
                    AppAnalytics.sendEvent(`switch_game`, gameItem.gameName);

                    // 判断 settings.settings.managerGameList 中是否有 item
                    let game = settings.settings.managerGameList?.find(
                        (game) => game.gameName === gameItem.gameName
                    );
                    if (game) {
                        // game = item
                        // 更新 settings.settings.managerGameList
                        settings.settings.managerGameList =
                            settings.settings.managerGameList.map((game) => {
                                if (game.gameName === gameItem.gameName) {
                                    return gameItem;
                                } else {
                                    return game;
                                }
                            });
                    } else {
                        settings.settings.managerGameList = [
                            ...settings.settings.managerGameList,
                            gameItem,
                        ];
                    }

                    return {
                        content: [],
                        structuredContent: {
                            state: true,
                            message: `成功将游戏 ${gameItem.gameName} 添加到管理器`,
                        },
                    };
                } else {
                    return {
                        content: [],
                        structuredContent: {
                            state: false,
                            message: `未找到ID为 ${GlossGameId} 的游戏`,
                        },
                    };
                }
            }
        );

        //#endregion

        //#region 将游戏从 管理器中移除
        this.server.registerTool(
            "remove-game-from-manager",
            {
                title: "Remove Game from Manager",
                description: `将游戏从管理器中移除; 
先使用 "get-manager-games-list" 获取已管理的游戏列表. 如果存在则执行移除操作
                `,
                inputSchema: {
                    GlossGameId: z.number(),
                },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ GlossGameId }) => {
                const settings = useSettings();

                settings.settings.managerGameList =
                    settings.settings.managerGameList.filter(
                        (game) => game.GlossGameId !== GlossGameId
                    );

                return {
                    content: [],
                    structuredContent: {
                        state: true,
                        message: `成功将游戏从管理器中移除`,
                    },
                };
            }
        );

        //#endregion

        //#region 获取当前已添加的Mod列表
        this.server.registerTool(
            "get-current-mod-list",
            {
                title: "Get Current Mod List",
                description: "获取当前游戏已添加的Mod列表",
                outputSchema: {
                    mods: z.array(z.object({})),
                    count: z.number(),
                },
            },
            async () => {
                const manager = useManager();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                mods: manager.managerModList,
                                count: manager.managerModList.length,
                            }),
                        },
                    ],
                    structuredContent: {
                        mods: manager.managerModList,
                        count: manager.managerModList.length,
                    },
                };
            }
        );
        //#endregion

        //#region 安装或卸载指定Mod
        this.server.registerTool(
            "install-mod-by-id",
            {
                title: "Install Mod by ID",
                description: `通过Mod ID安装或卸载指定的Mod;
在进行之前, 需要先使用 "get-current-mod-list" 获取Mod ID , 同时判断该Mod是否存在.
如果不存在则使用 "download-mod" 进行下载.

顺便判断是否存在前置插件，如果有则先下载和安装前置插件。

                `,
                inputSchema: {
                    modId: z.number(),
                    isInstall: z.boolean(),
                },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ modId, isInstall }) => {
                const manager = useManager();

                const modItem = manager.managerModList.find(
                    (mod) => mod.id == modId
                );
                if (modItem) {
                    this.navigationCallback?.("Manager");
                    modItem.isInstalled = isInstall;
                    return {
                        content: [],
                        structuredContent: {
                            state: true,
                            message: `成功${isInstall ? "安装" : "卸载"}Mod: ${
                                modItem.modName
                            }`,
                        },
                    };
                } else {
                    return {
                        content: [],
                        structuredContent: {
                            state: false,
                            message: `未找到ID为${modId}的Mod`,
                        },
                    };
                }
            }
        );
        //#endregion

        //#region 移除Mod
        this.server.registerTool(
            "remove-mod-by-id",
            {
                title: "Remove Mod by ID",
                description: "通过Mod ID移除指定的Mod",
                inputSchema: {
                    modId: z.number(),
                },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ modId }) => {
                const manager = useManager();

                const mod = manager.managerModList.find(
                    (item) => item.id == modId
                );
                if (mod) {
                    if (mod.isInstalled) {
                        mod.isInstalled = false;
                    }
                    manager.deleteMod(mod);
                    return {
                        content: [],
                        structuredContent: {
                            state: true,
                            message: `成功移除Mod: ${mod.modName}`,
                        },
                    };
                } else {
                    return {
                        content: [],
                        structuredContent: {
                            state: false,
                            message: `未找到ID为${modId}的Mod`,
                        },
                    };
                }
            }
        );
        //#endregion

        //#region 获取前置列表
        this.server.registerTool(
            "get-mod-dependencies",
            {
                title: "Get Mod Dependencies",
                description: "获取所需的前置依赖列表",
                inputSchema: {
                    GlassGameId: z.number(),
                },
                outputSchema: {
                    dependencies: z.array(z.object({})),
                },
            },
            async ({ GlassGameId }) => {
                const games = useGames();
                const dependencies = games.GamePlugins.filter((item) =>
                    item.game_id.includes(GlassGameId)
                );
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ dependencies }),
                        },
                    ],
                    structuredContent: {
                        dependencies,
                    },
                };
            }
        );

        //#endregion

        //#region 为 Mod 添加标签
        this.server.registerTool(
            "add-tag-to-mod",
            {
                title: "Add Tag to Mod",
                description: "为指定的Mod添加标签",
                inputSchema: {
                    modId: z.number(),
                    tag: z.object({
                        name: z.string(),
                        color: z.string(),
                    }),
                },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ modId, tag }) => {
                const manager = useManager();
                const mod = manager.managerModList.find(
                    (item) => item.id == modId
                );
                if (mod) {
                    if (!mod.tags) mod.tags = [];
                    mod.tags.push(tag);

                    if (
                        manager.tags.findIndex((t) => t.name == tag.name) === -1
                    ) {
                        manager.tags.push(tag);
                    }

                    return {
                        content: [],
                        structuredContent: {
                            state: true,
                            message: `成功为Mod添加标签: ${tag.name}`,
                        },
                    };
                } else {
                    return {
                        content: [],
                        structuredContent: {
                            state: false,
                            message: `未找到ID为${modId}的Mod`,
                        },
                    };
                }
            }
        );

        //#endregion

        //#region 为 Mod 移除标签
        this.server.registerTool(
            "remove-tag-from-mod",
            {
                title: "Remove Tag from Mod",
                description: "为指定的Mod移除标签",
                inputSchema: {
                    modId: z.number(),
                    tagName: z.string(),
                },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ modId, tagName }) => {
                const manager = useManager();
                const mod = manager.managerModList.find(
                    (item) => item.id == modId
                );
                if (mod) {
                    if (mod.tags) {
                        mod.tags = mod.tags.filter((t) => t.name !== tagName);
                    }
                    return {
                        content: [],
                        structuredContent: {
                            state: true,
                            message: `成功为Mod移除标签: ${tagName}`,
                        },
                    };
                } else {
                    return {
                        content: [],
                        structuredContent: {
                            state: false,
                            message: `未找到ID为${modId}的Mod`,
                        },
                    };
                }
            }
        );

        //#endregion

        //#region 重命名Mod
        this.server.registerTool(
            "rename-mod",
            {
                title: "Rename Mod",
                description: "重命名指定的Mod",
                inputSchema: {
                    modId: z.number(),
                    newName: z.string(),
                },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ modId, newName }) => {
                const manager = useManager();
                const mod = manager.managerModList.find(
                    (item) => item.id == modId
                );
                if (mod) {
                    mod.modName = newName;
                    return {
                        content: [],
                        structuredContent: {
                            state: true,
                            message: `成功重命名Mod为: ${newName}`,
                        },
                    };
                } else {
                    return {
                        content: [],
                        structuredContent: {
                            state: false,
                            message: `未找到ID为${modId}的Mod`,
                        },
                    };
                }
            }
        );

        //#endregion

        //#region 排序Mod
        this.server.registerTool(
            "sort-mods",
            {
                title: "Sort Mods",
                description: "对Mod进行排序",
                inputSchema: {
                    list: z.array(
                        z.object({
                            id: z.number(),
                            index: z.number(),
                        })
                    ),
                },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ list }) => {
                const manager = useManager();

                manager.managerModList.sort((a, b) => {
                    const itemA = list.find((item) => item.id === a.id);
                    const itemB = list.find((item) => item.id === b.id);
                    if (itemA && itemB) {
                        return itemA.index - itemB.index;
                    }
                    return 0;
                });
                return {
                    content: [],
                    structuredContent: {
                        state: true,
                        message: "成功排序Mods",
                    },
                };
            }
        );

        //#endregion

        //#region 下载Mod
        this.server.registerTool(
            "download-mod",
            {
                title: "Download Mod ",
                description: `下载指定的Mod`,
                inputSchema: {
                    webId: z.number().describe("模组网站ID"),
                    from: z
                        .enum([
                            "GlossMod",
                            "NexusMods",
                            "Thunderstore",
                            "ModIo",
                            "SteamWorkshop",
                            "CurseForge",
                            "GitHub",
                            "Customize",
                            "GameBanana",
                        ])
                        .describe(
                            "模组源类型。Thunderstore需要other.namespace和other.name，GitHub需要modWebsite"
                        ),
                    name: z.string().describe("Mod 名称"),
                    other: z
                        .object({
                            namespace: z
                                .string()
                                .describe("Thunderstore的命名空间")
                                .optional(),
                            name: z
                                .string()
                                .describe("Thunderstore的模组名称")
                                .optional(),
                        })
                        .describe(
                            "其他参数: Thunderstore={namespace:string,name:string}"
                        )
                        .optional(),
                    modWebsite: z
                        .string()
                        .describe("GitHub仓库地址，当from=GitHub时必填")
                        .optional(),
                },
                outputSchema: {
                    state: z.boolean(),
                    message: z.string(),
                },
            },
            async ({ webId, from, name, other, modWebsite }) => {
                const settings = useSettings();
                const download = useDownload();
                if (!webId || !from || !name) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "参数错误：webId, from, name 为必填项",
                            },
                        ],
                    };
                }

                // 验证规则
                // GitHub: modWebsite 必填，为 GitHub 仓库地址
                if (from === "GitHub" && !modWebsite) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "当 from 为 GitHub 时, modWebsite 必填",
                            },
                        ],
                        structuredContent: {
                            state: false,
                            message: "当 from 为 GitHub 时, modWebsite 必填",
                        },
                    };
                }
                // Thunderstore: other 需要 namespace 和 name 参数
                if (
                    from === "Thunderstore" &&
                    (!other ||
                        !(other as any).namespace ||
                        !(other as any).name)
                ) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "参数错误：当 from 为 Thunderstore 时，需要传递 other 参数，格式为：{ namespace: string, name: string }。例如：other: { namespace: 'AuthorName', name: 'ModName' }",
                            },
                        ],
                        structuredContent: {
                            state: false,
                            message:
                                "当 from 为 Thunderstore 时，需要传递 other: { namespace: string, name: string }",
                        },
                    };
                }

                let modStorage = path.join(
                    settings.settings.modStorageLocation,
                    "cache",
                    name
                );
                const mod: any = {
                    webId,
                    from,
                    fileName: name,
                    other,
                    modWebsite,
                };

                download.ReStart(mod, modStorage);
                return {
                    content: [
                        {
                            type: "text",
                            text: "下载已开始, 可在 下载管理 页面查看下载进度。",
                        },
                    ],
                    structuredContent: {
                        state: true,
                        message: "下载已开始",
                    },
                };
            }
        );
        //#endregion

        //#region 获取Mod储存目录
        this.server.registerTool(
            "get-mod-storage-path",
            {
                title: "Get Mod Storage Path",
                description: "获取Mod储存目录",
                inputSchema: {
                    modId: z.string().describe("Mod ID"),
                },
                outputSchema: {
                    storagePath: z.string().describe("Mod储存目录路径"),
                },
            },
            async ({ modId }) => {
                const manager = useManager();
                const modStorage = path.join(manager.modStorage, modId);
                return {
                    content: [
                        {
                            type: "text",
                            text: modStorage,
                        },
                    ],
                    structuredContent: {
                        storagePath: modStorage,
                    },
                };
            }
        );

        //#region

        //#region 获取指定目录的里面的所有文件夹
        this.server.registerTool(
            "get-directory-contents",
            {
                title: "Get Directory Contents",
                description: "获取指定目录的里面的所有文件夹",
                inputSchema: {
                    directoryPath: z.string().describe("目录路径"),
                    subdirectory: z
                        .boolean()
                        .describe("是否包含子目录")
                        .optional(),
                },
                outputSchema: {
                    contents: z.array(z.string()),
                },
            },
            async ({ directoryPath, subdirectory }) => {
                const contents = FileHandler.getAllFolderInFolder(
                    directoryPath,
                    subdirectory
                );
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ contents }),
                        },
                    ],
                    structuredContent: { contents },
                };
            }
        );
        //#endregion

        //#region 获取指定目录的里面的所有文件
        this.server.registerTool(
            "get-files-in-directory",
            {
                title: "Get Files in Directory",
                description: "获取指定目录的里面的所有文件",
                inputSchema: {
                    directoryPath: z.string().describe("目录路径"),
                    includepath: z
                        .boolean()
                        .describe("是否包含完整路径")
                        .optional(),
                    subdirectory: z
                        .boolean()
                        .describe("是否包含子目录")
                        .optional(),
                    getFolder: z
                        .boolean()
                        .describe("是否获取文件夹名称")
                        .optional(),
                },
                outputSchema: {
                    files: z.array(z.string()),
                },
            },
            async ({ directoryPath, includepath, subdirectory, getFolder }) => {
                const files = FileHandler.getAllFilesInFolder(
                    directoryPath,
                    includepath,
                    subdirectory,
                    getFolder
                );
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ files }),
                        },
                    ],
                    structuredContent: { files },
                };
            }
        );
        //#endregion

        //#region 复制文件到指定位置
        this.server.registerTool(
            "copy-file-to-location",
            {
                title: "Copy File to Location",
                description: "复制文件到指定位置",
                inputSchema: {
                    sourcePath: z.string().describe("源文件路径"),
                    destinationPath: z.string().describe("目标文件路径"),
                },
                outputSchema: {
                    success: z.boolean(),
                },
            },
            async ({ sourcePath, destinationPath }) => {
                const success = FileHandler.copyFile(
                    sourcePath,
                    destinationPath
                );
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ success }),
                        },
                    ],
                    structuredContent: { success },
                };
            }
        );
        //#endregion

        //#region 复制文件夹
        this.server.registerTool(
            "copy-folder-to-location",
            {
                title: "Copy Folder to Location",
                description: "复制文件夹到指定位置",
                inputSchema: {
                    sourcePath: z.string().describe("源文件夹路径"),
                    destinationPath: z.string().describe("目标文件夹路径"),
                },
                outputSchema: {
                    success: z.boolean(),
                },
            },
            async ({ sourcePath, destinationPath }) => {
                const success = FileHandler.copyFolder(
                    sourcePath,
                    destinationPath
                );
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ success }),
                        },
                    ],
                    structuredContent: { success },
                };
            }
        );
        //#endregion

        //#region 读取文件内容
        this.server.registerTool(
            "read-file-contents",
            {
                title: "Read File Contents",
                description: "读取文件内容",
                inputSchema: {
                    filePath: z.string().describe("文件路径"),
                },
                outputSchema: {
                    content: z.string().describe("文件内容"),
                },
            },
            async ({ filePath }) => {
                const content = FileHandler.readFile(filePath);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ content }),
                        },
                    ],
                    structuredContent: { content },
                };
            }
        );

        //#endregion
    }
    private registerResource() {
        //#region 相关资源

        this.server.registerResource(
            "supported-games-list",
            "games://supported-games-list",
            {
                title: "Supported Games List",
                description: "获取支持的游戏列表",
                mimeType: "application/json",
            },
            async () => {
                const manager = useManager();
                const gamesList: ISupportedGames[] = JSON.parse(
                    JSON.stringify(manager.supportedGames)
                );
                return {
                    contents: [
                        {
                            uri: "games://supported-games-list",
                            text: JSON.stringify(gamesList),
                            mimeType: "application/json",
                        },
                    ],
                };
            }
        );
        this.server.registerResource(
            "mod-dependencies",
            "mods://mod-dependencies",
            {
                title: "Mod Dependencies",
                description: "获取所需的前置依赖列表",
                mimeType: "application/json",
            },
            async () => {
                const games = useGames();
                return {
                    contents: [
                        {
                            uri: "mods://mod-dependencies",
                            text: JSON.stringify({
                                dependencies: games.GamePlugins,
                            }),
                            mimeType: "application/json",
                        },
                    ],
                };
            }
        );

        this.server.registerResource(
            "mod-list",
            "mods://mod-list",
            {
                title: "Mod list",
                description: "获取当前游戏已添加的Mod列表",
                mimeType: "application/json",
            },
            async () => {
                const manager = useManager();
                return {
                    contents: [
                        {
                            uri: "mods://mod-list",
                            text: JSON.stringify(manager.managerModList),
                            mimeType: "application/json",
                        },
                    ],
                };
            }
        );

        this.server.registerResource(
            "i18n-language-list",
            "system://i18n-language-list",
            {
                title: "Language List",
                description: "翻译文本列表",
                mimeType: "application/json",
            },
            async () => {
                const language = getLangAll();

                // 获取语言列表
                return {
                    contents: [
                        {
                            uri: "system://i18n-language-list",
                            text: JSON.stringify(language),
                            mimeType: "application/json",
                        },
                    ],
                };
            }
        );

        this.server.registerResource(
            "mod-storage-path",
            "storage://mod-storage-path",
            {
                title: "Mod Storage Path",
                description: "Mod储存目录路径",
                mimeType: "text/plain",
            },
            async () => {
                const manager = useManager();
                const modStorage = path.join(manager.modStorage);
                return {
                    contents: [
                        {
                            uri: "mods://mod-storage-path",
                            text: modStorage,
                            mimeType: "text/plain",
                        },
                    ],
                };
            }
        );

        this.server.registerResource(
            "game-storage-path",
            "storage://game-storage-path",
            {
                title: "Game Storage Path",
                description: "Game储存目录路径",
                mimeType: "text/plain",
            },
            async () => {
                const manager = useManager();
                const gameStorage = path.join(manager.gameStorage);
                return {
                    contents: [
                        {
                            uri: "storage://game-storage-path",
                            text: gameStorage,
                            mimeType: "text/plain",
                        },
                    ],
                };
            }
        );

        //#endregion
    }

    private registerPrompt() {
        //#region 获取所有游戏列表
        this.server.registerPrompt(
            "get-all-games-list",
            {
                title: "Get All Games List",
                description: "获取所有支持的游戏列表",
            },
            () => ({
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `获取所有管理器支持的游戏列表.`,
                        },
                    },
                ],
            })
        );
        //#endregion

        //#region 整理Mod
        this.server.registerPrompt(
            "organize-mods",
            {
                title: "Organize Mods",
                description: "整理Mod",
            },
            () => ({
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `帮我重命名Mod + 标签归类 + 排序`,
                        },
                    },
                ],
            })
        );
        //#endregion

        //#region 下载Mod
        this.server.registerPrompt(
            "download-mod-prompt",
            {
                title: "Download Mod Prompt",
                description: "下载Mod的提示",
                argsSchema: { link: z.string().describe("Mod地址") },
            },
            ({ link }) => ({
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: `帮我下载这个Mod: ${link} `,
                        },
                    },
                ],
            })
        );

        //#endregion
    }
}
