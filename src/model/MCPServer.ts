import {
    McpServer,
    ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import express from "express";

import { z } from "zod";

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
        //#region 获取游戏列表
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
                    games: z.array(
                        z.object({
                            GlossGameId: z.number(),
                            steamAppID: z.number(),
                            SteamWorkshop: z.boolean().optional(),
                            installdir: z.string().optional(),
                            gameName: z.string(),
                            gameExe: z.union([z.string(), z.array(z.any())]),
                            startExe: z
                                .union([z.string(), z.array(z.any())])
                                .optional(),
                            gamePath: z.string().optional(),
                            gameVersion: z.string().optional(),
                            gameCoverImg: z.string().optional(),
                            nexusMods: z
                                .object({
                                    game_id: z.number(),
                                    game_domain_name: z.string(),
                                })
                                .optional(),
                            Thunderstore: z
                                .object({
                                    community_identifier: z.string(),
                                })
                                .optional(),
                            mod_io: z.number().optional(),
                            gamebanana: z.number().optional(),
                            curseforge: z.number().optional(),
                            archivePath: z.string().optional(),
                            modType: z.array(z.any()),
                            sortMod: z.function().optional(),
                        })
                    ),
                },
            },
            async () => {
                const settings = useSettings();
                const gamesList: ISupportedGames[] = JSON.parse(
                    JSON.stringify(settings.settings.managerGameList)
                );
                const output = { games: gamesList };
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

        //#region 获取当前已添加的Mod列表
        this.server.registerTool(
            "get-current-mod-list",
            {
                title: "Get Current Mod List",
                description: "获取当前游戏已添加的Mod列表",
                outputSchema: {
                    mods: z.array(z.object({})),
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
                            }),
                        },
                    ],
                    structuredContent: { mods: manager.managerModList },
                };
            }
        );
        //#endregion

        //#region 安装或卸载指定Mod
        this.server.registerTool(
            "install-mod-by-id",
            {
                title: "Install Mod by ID",
                description: "通过Mod ID安装指定的Mod",
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
    }
}
