<script setup lang="ts">
import {
    Box,
    Gamepad2,
    GamepadDirectional,
    ArrowDownToLine,
    Info,
    Settings,
} from "lucide-vue-next";
const list = [
    {
        title: "游戏",
        icon: Gamepad2,
        to: "/games",
    },
    {
        title: "管理",
        icon: Box,
        to: "/manager",
    },
    {
        title: "游览",
        icon: GamepadDirectional,
        to: "/explore",
    },
    {
        title: "下载",
        icon: ArrowDownToLine,
        to: "/download",
    },
    {
        title: "设置",
        icon: Settings,
        to: "/settings",
    },
    {
        title: "关于",
        icon: Info,
        to: "/about",
    },
];
</script>
<template>
    <div class="flex flex-col gap-4">
        <Card>
            <CardHeader>
                <CardTitle
                    >欢迎使用 Gloss Mod Manager, 在这里你可以...</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div class="flex gap-2">
                    <!-- 快捷导航 -->
                    <Button
                        v-for="item in list"
                        :key="item.to"
                        as-child
                        variant="secondary">
                        <router-link :to="item.to">
                            <component :is="item.icon" class="h-5 w-5" />
                            {{ item.title }}
                        </router-link>
                    </Button>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>合作方</CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    class="grid grid-cols-3 items-center gap-4 justify-items-center links">
                    <a
                        href="https://mod.3dmgame.com/"
                        target="_blank"
                        class="flex w-full items-center justify-center">
                        <img src="/imgs/3DMGAME.webp" alt="3DMGAME" />
                    </a>
                    <a
                        href="https://thunderstore.io/"
                        target="_blank"
                        class="flex w-full items-center justify-center">
                        <Thunderstore width="100%"></Thunderstore>
                    </a>
                    <a
                        href="https://mod.io/"
                        target="_blank"
                        class="flex w-full items-center justify-center">
                        <ModIo width="100%"></ModIo>
                    </a>
                    <a
                        href="https://www.curseforge.com/"
                        target="_blank"
                        class="flex w-full items-center justify-center">
                        <CurseForge width="100%"></CurseForge>
                    </a>
                    <a
                        href="https://gamebanana.com/"
                        target="_blank"
                        class="flex w-full items-center justify-center">
                        <img src="/imgs/Gamebanana.png" alt="Gamebanana" />
                    </a>
                    <a
                        href="https://www.nexusmods.com/"
                        class="flex w-full items-center justify-center">
                        <NexusMods height="84px" width="100%"></NexusMods>
                    </a>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
<style scoped>
.links a:hover {
    transition: all 0.5s;
    transform: scale(1.05);
}
</style>
