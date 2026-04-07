import { createApp } from "vue";
import App from "@/App.vue";
import router from "@/routes";
import "@/style.css";
import { initializeTheme } from "@/lib/theme";

initializeTheme();

const app = createApp(App);
app.use(router);

app.mount("#app");
