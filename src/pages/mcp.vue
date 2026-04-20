<script setup lang="ts">
import { ElMessage } from "element-plus-message";
import {
    Bot,
    CheckCircle2,
    CircleAlert,
    Copy,
    ExternalLink,
    LoaderCircle,
    Square,
} from "lucide-vue-next";
import {
    McpService,
    mcpPromptDefinitions,
    mcpResourceDefinitions,
    mcpToolDefinitions,
} from "@/lib/mcp-service";

void McpService.initialize();

const endpoint = McpService.endpoint;
const isBusy = McpService.isBusy;
const serverStatus = McpService.serverStatus;
const portModel = computed<number>({
    get: () => McpService.port.value,
    set: (value) => {
        if (!Number.isFinite(value)) {
            return;
        }

        try {
            McpService.setPort(value);
        } catch {
            // 输入过程中的临时无效值不需要额外提示，提交时会再校验。
        }
    },
});

const enabledModel = computed<boolean>({
    get: () => {
        return (
            serverStatus.value === "running" || serverStatus.value === "starting"
        );
    },
    set: async (enabled) => {
        try {
            if (enabled) {
                await McpService.start();
                ElMessage.success("MCP 服务已启动。");
                return;
            }

            await McpService.stop();
            ElMessage.success("MCP 服务已停止。");
        } catch (error: unknown) {
            console.error("切换 MCP 服务失败");
            console.error(error);
            ElMessage.error(
                error instanceof Error ? error.message : "切换 MCP 服务失败。",
            );
        }
    },
});

const statusMeta = computed(() => {
    switch (serverStatus.value) {
        case "running":
            return {
                icon: CheckCircle2,
                iconClass: "text-emerald-500",
                label: "服务器运行中",
            };
        case "starting":
            return {
                icon: LoaderCircle,
                iconClass: "text-amber-500 animate-spin",
                label: "服务器启动中",
            };
        case "stopping":
            return {
                icon: LoaderCircle,
                iconClass: "text-amber-500 animate-spin",
                label: "服务器停止中",
            };
        default:
            return {
                icon: Square,
                iconClass: "text-muted-foreground",
                label: "服务器已停止",
            };
    }
});

const vscodeConfig = computed(() => {
    return JSON.stringify(
        {
            servers: {
                "gloss-mod-manager": {
                    type: "http",
                    url: endpoint.value,
                },
            },
        },
        null,
        4,
    );
});

async function copyVscodeConfig() {
    try {
        await navigator.clipboard.writeText(vscodeConfig.value);
        ElMessage.success("已复制 VS Code MCP 配置。");
    } catch (error: unknown) {
        console.error("复制 MCP 配置失败");
        console.error(error);
        ElMessage.error("复制 MCP 配置失败。");
    }
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <Card>
            <CardHeader
                class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
            >
                <div class="space-y-2">
                    <CardTitle class="flex items-center gap-2">
                        <Bot class="h-5 w-5" />
                        <span>MCP 服务</span>
                    </CardTitle>
                    <CardDescription class="max-w-3xl leading-6">
                        在本机启动一个 MCP HTTP 端点，让 VS Code、Copilot
                        MCP 或其他兼容客户端可以直接读取 Gloss Mod Manager
                        的游戏、Mod 与文件操作能力。
                    </CardDescription>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" class="gap-2 rounded-full px-3 py-1">
                        <component
                            :is="statusMeta.icon"
                            :class="['h-4 w-4', statusMeta.iconClass]"
                        />
                        {{ statusMeta.label }}
                    </Badge>
                    <div class="flex items-center gap-2">
                        <Label for="mcp-enabled">启用服务</Label>
                        <Switch
                            id="mcp-enabled"
                            v-model="enabledModel"
                            :disabled="isBusy"
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
                <div class="space-y-4">
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="mcp-port">端口号</Label>
                            <Input
                                id="mcp-port"
                                v-model.number="portModel"
                                type="number"
                                min="1"
                                max="65535"
                                :disabled="enabledModel || isBusy"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="mcp-endpoint">MCP 地址</Label>
                            <Input
                                id="mcp-endpoint"
                                :model-value="endpoint"
                                readonly
                            />
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-3">
                        <Button as-child variant="secondary">
                            <a
                                href="https://gmm.aoe.top/MCP.html"
                                target="_blank"
                                rel="noreferrer"
                            >
                                配置教程
                                <ExternalLink class="h-4 w-4" />
                            </a>
                        </Button>
                        <Button as-child variant="outline">
                            <a
                                href="https://www.bilibili.com/video/BV13K1YBtE6e/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                相关视频
                                <ExternalLink class="h-4 w-4" />
                            </a>
                        </Button>
                        <Button variant="outline" @click="copyVscodeConfig">
                            <Copy class="h-4 w-4" />
                            复制 VS Code 配置
                        </Button>
                    </div>

                    <div class="rounded-xl border bg-muted/35 p-4 text-sm leading-6">
                        <div class="flex items-start gap-3">
                            <CircleAlert
                                class="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                            />
                            <div class="space-y-1 text-muted-foreground">
                                <p>
                                    服务仅监听本机
                                    <code class="rounded bg-background px-1.5 py-0.5">
                                        127.0.0.1
                                    </code>
                                    ，运行中无法修改端口。
                                </p>
                                <p>
                                    建议先调用只读工具确认目标游戏和当前 Mod
                                    状态，再执行安装、卸载、排序或文件复制操作。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div class="rounded-xl border p-4">
                        <div class="text-sm text-muted-foreground">Tools</div>
                        <div class="mt-2 text-2xl font-semibold">
                            {{ mcpToolDefinitions.length }}
                        </div>
                    </div>
                    <div class="rounded-xl border p-4">
                        <div class="text-sm text-muted-foreground">Resources</div>
                        <div class="mt-2 text-2xl font-semibold">
                            {{ mcpResourceDefinitions.length }}
                        </div>
                    </div>
                    <div class="rounded-xl border p-4">
                        <div class="text-sm text-muted-foreground">Prompts</div>
                        <div class="mt-2 text-2xl font-semibold">
                            {{ mcpPromptDefinitions.length }}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader class="flex flex-row items-start justify-between gap-4">
                <div class="space-y-1.5">
                    <CardTitle>VS Code 配置</CardTitle>
                    <CardDescription>
                        在工作区创建
                        <code class="rounded bg-muted px-1.5 py-0.5">
                            .vscode/mcp.json
                        </code>
                        ，填入下面的最小配置即可连接当前实例。
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" @click="copyVscodeConfig">
                    <Copy class="h-4 w-4" />
                    复制
                </Button>
            </CardHeader>
            <CardContent>
                <pre
                    class="overflow-x-auto rounded-xl border bg-muted/35 p-4 text-xs leading-6"
                ><code>{{ vscodeConfig }}</code></pre>
            </CardContent>
        </Card>

        <div class="grid gap-6 2xl:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>可用 Tools</CardTitle>
                    <CardDescription>
                        当前版本优先覆盖游戏管理、Mod 管理和常用文件能力。
                    </CardDescription>
                </CardHeader>
                <CardContent class="grid gap-3">
                    <div
                        v-for="item in mcpToolDefinitions"
                        :key="item.name"
                        class="rounded-xl border p-3"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <span class="font-medium">{{ item.name }}</span>
                            <Badge variant="secondary">{{ item.title }}</Badge>
                        </div>
                        <p class="mt-2 text-sm text-muted-foreground">
                            {{ item.description }}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>可用 Resources</CardTitle>
                    <CardDescription>
                        适合直接读取结构化数据，不会触发本地状态修改。
                    </CardDescription>
                </CardHeader>
                <CardContent class="grid gap-3">
                    <div
                        v-for="item in mcpResourceDefinitions"
                        :key="item.uri"
                        class="rounded-xl border p-3"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <span class="font-medium">{{ item.uri }}</span>
                            <Badge variant="outline">{{ item.title }}</Badge>
                        </div>
                        <p class="mt-2 text-sm text-muted-foreground">
                            {{ item.description }}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>可用 Prompts</CardTitle>
                    <CardDescription>
                        这些提示词会引导客户端先做正确的只读探测，再进入执行阶段。
                    </CardDescription>
                </CardHeader>
                <CardContent class="grid gap-3">
                    <div
                        v-for="item in mcpPromptDefinitions"
                        :key="item.name"
                        class="rounded-xl border p-3"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <span class="font-medium">{{ item.name }}</span>
                            <Badge variant="outline">{{ item.title }}</Badge>
                        </div>
                        <p class="mt-2 text-sm text-muted-foreground">
                            {{ item.description }}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>

<style scoped></style>
