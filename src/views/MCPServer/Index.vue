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
                <v-col>
                    <v-btn
                        href="https://gmm.aoe.top/MCP.html"
                        append-icon="mdi-open-in-new"
                        >配置教程</v-btn
                    >
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
