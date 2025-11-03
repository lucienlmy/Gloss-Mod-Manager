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
            serverStatus.value = "stopped";
            if (server) {
                server.stop();
            }
        }
    },
    { immediate: true }
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
                <v-col cols="12">
                    <v-btn
                        href="https://gmm.aoe.top/MCP.html"
                        append-icon="mdi-open-in-new"
                        >配置教程</v-btn
                    >
                </v-col>
                <v-col cols="12">
                    <v-card title="相关视频">
                        <v-card-text>
                            <v-card
                                href="https://www.bilibili.com/video/BV13K1YBtE6e/"
                                target="_blank"
                                class="video-card"
                                rounded="lg"
                                elevation="2"
                            >
                                <v-img
                                    src="https://assets-mod.3dmgame.com/static/upload/mod/202511/MOD690873f6cb561.png@webp"
                                    class="video-img"
                                ></v-img>
                            </v-card>
                        </v-card-text>
                    </v-card>
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
<style lang="less" scoped>
.video-card {
    width: 350px;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
    }
}

.video-img {
    border-radius: 8px;
    transition: transform 0.3s ease;

    .video-card:hover & {
        transform: scale(1.05);
    }
}
</style>
