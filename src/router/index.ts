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
            path: "/Backup",
            name: "Backup",
            component: () => import("@src/views/Backup.vue"),
        },
        {
            path: "/Games",
            name: "Games",
            component: () => import("@src/views/Games.vue"),
        },
        {
            path: "/Explore",
            name: "ExploreHome",
            component: () => import("@src/views/Explore.vue"),
            children: [
                {
                    path: "GlossMod/:modId",
                    name: "GlossModContent",
                    component: () => import("@src/components/Explore/GlossMod/Content/Content.vue"),
                },
                {
                    path: "ModIo/:modId",
                    name: "ModIoModsContent",
                    component: () => import("@src/components/Explore/ModIo/Content/Content.vue")
                },
                {
                    path: "Thunderstore/:namespace/:name/:version",
                    name: "ThunderstoreModsContent",
                    component: () => import("@src/components/Explore/Thunderstore/Content/Content.vue")
                },
                {
                    path: "SteamWorkshop/:workshopId",
                    name: "SteamWorkshop",
                    component: () => import("@src/components/Explore/SteamWorkshop/Content/Content.vue")
                },
                {
                    path: "CurseForge/:CurseForgeModId",
                    name: "CurseForgeContent",
                    component: () => import("@src/components/Explore/CurseForge/Content/Content.vue")
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
        {
            path: "/User",
            name: "User",
            component: () => import("@src/views/User.vue"),
        }
    ]
});

// 切换路由时，滚动到顶部
router.afterEach(() => {
    window.scrollTo(0, 0);
});


export default router;