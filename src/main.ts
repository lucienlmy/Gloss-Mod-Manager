import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/routes";
import "@/style.css";
import { Aria2Rpc } from "@/lib/aria2-rpc";
import { initializeGlossDownloadMonitor } from "@/lib/gloss-download-monitor";
import { Log } from "@/lib/log";
import { McpService } from "@/lib/mcp-service";
import { Theme } from "@/lib/theme";
import lang from "@/lang";
import { useManager } from "@/stores/manager";
import { useSettings } from "@/stores/settings";

import "element-plus-message/dist/index.css"; // 主要样式
import "element-plus-message/theme-chalk/dark/css-vars.css"; // 暗色模式

async function bootstrap() {
    await Log.initialize();
    await Theme.initialize();

    const app = createApp(App);
    const pinia = createPinia();
    app.use(router);
    app.use(lang);
    app.use(pinia);
    await McpService.initialize(pinia);

    app.mount("#app");

    initializeGlossDownloadMonitor(useManager(pinia), useSettings(pinia));

    void Aria2Rpc.autoStartFromSettings();
    await Log.info("应用启动完成。");
}

void bootstrap();
