import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/routes";
import "@/style.css";
import { Aria2Rpc } from "@/lib/aria2-rpc";
import { initializeAppUpdater } from "@/lib/app-updater";
import { initializeExternalLaunchHandling } from "@/lib/external-launch";
import { initializeGlossDownloadMonitor } from "@/lib/gloss-download-monitor";
import { Language } from "@/lib/language";
import { Log } from "@/lib/log";
import { McpService } from "@/lib/mcp-service";
import { Theme } from "@/lib/theme";
import lang from "@/lang";
import { useSettings } from "@/stores/settings";

import "element-plus-message/dist/index.css"; // 主要样式
import "element-plus-message/theme-chalk/dark/css-vars.css"; // 暗色模式

async function bootstrap() {
    await Log.initialize();
    await Theme.initialize();
    await Language.initialize();

    const app = createApp(App);
    const pinia = createPinia();
    app.use(router);
    app.use(lang);
    app.use(pinia);
    await McpService.initialize(pinia);

    app.mount("#app");

    await initializeExternalLaunchHandling();

    // 首屏渲染后恢复 MCP 服务的上次启停状态，避免阻塞应用启动。
    void McpService.autoStartFromSettings();
    initializeGlossDownloadMonitor(useSettings(pinia));
    initializeAppUpdater();

    void Aria2Rpc.autoStartFromSettings();
    await Log.info("应用启动完成。");
}

void bootstrap();
