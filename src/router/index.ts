import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: "/",
            name: "Home",
            component: () => import("@src/views/Home.vue"),
        },
        {
            path: "/Manager",
            name: "Manager",
            component: () => import("@src/views/Manager.vue"),
        },
        {
            path: "/Explore",
            name: "Explore",
            component: () => import("@src/views/Explore.vue"),
        },
        {
            path: "/Settings",
            name: "Settings",
            component: () => import("@src/views/Settings.vue"),
        },
        {
            path: "/About",
            name: "About",
            component: () => import("@src/views/About.vue"),
        },
    ]
});


export default router;