<script lang="ts" setup>
const router = useRouter();
const mcpstate = ref(false);
const port = ref(36412);
const serverStatus = ref<"stopped" | "starting" | "running" | "stopping">(
    "stopped"
);
let server: MCPServer | null = null;

watch(
    mcpstate,
    () => {
        if (mcpstate.value) {
            serverStatus.value = "starting";
            server = new MCPServer();
            server.setStatusCallback((running: boolean) => {
                serverStatus.value = running ? "running" : "stopped";
                if (!running) {
                    mcpstate.value = false;
                }
            });
            // 设置导航回调
            server.setNavigationCallback((routeName: string) => {
                router.push({ name: routeName });
            });
            server.start(port.value);
        } else {
            serverStatus.value = "stopping";
            if (server) {
                server.stop();
            }
        }
    },
    { immediate: true }
);

const docs = computed(
    () => `## MCP 服务器使用教程

MCP (Model Context Protocol) 服务器允许第三方应用通过 HTTP 接口与 Gloss Mod Manager 进行交互，从而实现自动化管理 Mod 的功能。

### 快速开始

#### 1. 配置
在支持 MCP 的应用中配置如下：

\`\`\`json
"gloss-mod-manager": {
    "type": "http",
    "url": "http://localhost:${port.value}/mcp"
}
\`\`\`

#### 2. 启用服务器
- 在本页面打开 **启用 MCP 服务器** 开关
- 确认服务器状态显示为 **服务器运行中**（绿色）
- 默认端口为 **36412**（支持自定义）

### 可用工具 (Tools)

#### 游戏管理
- **get-supported-games-list** - 获取支持的游戏列表
- **get-manager-games-list** - 获取已添加到管理器的游戏列表
- **get-current-managed-game** - 获取当前正在管理的游戏
- **switch-managed-game** - 切换管理的游戏
- **add-game-to-manager** - 将游戏添加到管理器
- **remove-game-from-manager** - 从管理器中移除游戏
- **fetch-steam-installed-games** - 从 Steam 获取已安装的游戏

#### Mod 管理
- **get-current-mod-list** - 获取当前游戏的 Mod 列表
- **install-mod-by-id** - 安装或卸载指定 Mod
- **remove-mod-by-id** - 移除指定 Mod
- **rename-mod** - 重命名 Mod
- **sort-mods** - 对 Mod 列表排序
- **download-mod** - 下载指定 Mod

#### Mod 标签和依赖
- **add-tag-to-mod** - 为 Mod 添加标签
- **remove-tag-from-mod** - 移除 Mod 标签
- **get-mod-dependencies** - 获取前置依赖列表
- **translate-game-name** - 翻译游戏名称

#### 文件操作
- **get-directory-contents** - 获取目录下的所有文件夹
- **get-files-in-directory** - 获取目录下的所有文件

### 可用资源 (Resources)

- **games://supported-games-list** - 支持的游戏列表（JSON 格式）
- **mods://mod-list** - 当前游戏的 Mod 列表（JSON 格式）
- **mods://mod-dependencies** - Mod 前置依赖列表（JSON 格式）

### 使用示例

#### 示例 1: 获取所有支持的游戏
\`\`\`
工具: get-supported-games-list
返回: { games: [...], count: N }
\`\`\`

#### 示例 2: 切换到特定游戏并安装 Mod
\`\`\`
1. 工具: get-supported-games-list (获取游戏 ID)
2. 工具: switch-managed-game { GlossGameId: 123 }
3. 工具: download-mod { webId: 456, from: "GlossMod", name: "MyMod" }
4. 工具: install-mod-by-id { modId: 789, isInstall: true }
\`\`\`

### 支持的 Mod 源

下载 Mod 时支持以下源：
- **GlossMod** - Gloss Mod 网站
- **NexusMods** - Nexus Mods 网站
- **Thunderstore** - Thunderstore 平台
- **ModIo** - Mod.io 平台
- **CurseForge** - CurseForge 平台
- **GitHub** - GitHub Release
- **GameBanana** - GameBanana 平台
- **SteamWorkshop** - Steam 创意工坊
- **Customize** - 自定义 URL

### 注意事项

⚠️ **重要提示**
- 服务器启动后，端口号无法修改，需要先停止服务器再修改
- 默认监听本地 \`localhost\`，不支持远程访问
- 某些操作可能需要检查前置依赖（GamePlugins）
- 下载 Mod 时需要确保已添加目标游戏到管理器

### 常见问题

**Q: 为什么连接失败？**
- 确保服务器已启用（状态为绿色）
- 检查端口号是否正确
- 确认防火墙未阻止该端口

**Q: 如何在下载前检查 Mod 是否存在？**
- 使用 \`get-current-mod-list\` 获取已有 Mod 列表
- 如果 Mod 不存在，使用 \`download-mod\` 下载

**Q: 下载的 Mod 存储在哪里？**
- 默认存储在管理器配置的 Mod 存储位置的 \`cache\` 文件夹中

### 更多帮助

如需更多信息，请访问[官方文档](https://gmm.aoe.top/)或[反馈页面](https://github.com/GlossMod/Gloss-Mod-Manager/issues)。
`
);
</script>
<template>
    <v-card title="MCP 服务器">
        <v-card-text>
            <v-row>
                <v-col>
                    <v-switch
                        v-model="mcpstate"
                        color="#29B6F6"
                        :label="`启用 MCP 服务器`"
                    />
                    <v-text-field
                        v-model="port"
                        type="number"
                        label="端口号"
                        :disabled="mcpstate"
                    />
                    <v-chip
                        :color="
                            serverStatus === 'running'
                                ? 'success'
                                : serverStatus === 'stopped'
                                ? 'error'
                                : 'warning'
                        "
                        text-color="white"
                        class="mt-4"
                    >
                        <v-icon start>
                            {{
                                serverStatus === "running"
                                    ? "mdi-check-circle"
                                    : serverStatus === "stopped"
                                    ? "mdi-alert-circle"
                                    : "mdi-clock"
                            }}
                        </v-icon>
                        {{
                            serverStatus === "running"
                                ? "服务器运行中"
                                : serverStatus === "stopped"
                                ? "服务器已停止"
                                : serverStatus === "starting"
                                ? "服务器启动中..."
                                : "服务器停止中..."
                        }}
                    </v-chip>
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <Markdown :text="docs" />
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>
<script lang="ts">
export default {
    name: "MCPServer",
};
</script>
<style lang="less" scoped></style>
