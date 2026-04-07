import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/routes";
import "@/style.css";
import { Theme } from "@/lib/theme";

import "element-plus-message/dist/index.css"; // 主要样式
import "element-plus-message/theme-chalk/dark/css-vars.css"; // 暗色模式

Theme.initialize();

const app = createApp(App);
app.use(router);
app.use(createPinia());

app.mount("#app");
