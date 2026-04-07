import { routes } from "vue-router/auto-routes";
import { createWebHashHistory, createRouter } from "vue-router";

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
