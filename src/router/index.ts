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
            name: "ExploreHome",
            component: () => import("@src/views/Explore.vue"),
            children: [
                {
                    path: ":modId",
                    name: "ExploreContent",
                    component: () => import("@src/views/Explore/Content.vue"),
                }
            ]
        },
        {
            path: "/Download",
            name: "Download",
            component: () => import("@src/views/Download.vue"),
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

// 切换路由时，滚动到顶部
router.afterEach(() => {
    window.scrollTo(0, 0);
});


export default router;