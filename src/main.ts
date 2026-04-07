import { createApp } from "vue";
import App from "./App.vue";
import { routes } from "vue-router/auto-routes";
import { createWebHashHistory, createRouter } from "vue-router";
import "./style.css";

const app = createApp(App);
app.use(
    createRouter({
        history: createWebHashHistory(),
        routes,
    }),
);

app.mount("#app");
