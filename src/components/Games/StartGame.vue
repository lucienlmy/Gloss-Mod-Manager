<script setup lang="ts">
import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";

const props = defineProps<{
    game: ISupportedGames;
}>();

async function launchGame(startItem?: string | IStartExe) {
    if (!props.game) {
        ElMessage.warning("请先选择游戏。");
        return;
    }

    const target = startItem ?? props.game.startExe;

    if (!target) {
        ElMessage.warning("当前游戏没有可用的启动配置。");
        return;
    }

    if (typeof target === "string") {
        if (!props.game.gamePath) {
            ElMessage.warning("当前游戏还没有配置安装目录。");
            return;
        }

        await FileHandler.runExe(await join(props.game.gamePath ?? "", target));
        return;
    }

    if (Array.isArray(target)) {
        if (target.length === 0) {
            ElMessage.warning("当前游戏没有可用的启动配置。");
            return;
        }

        await launchGame(target[0]);
        return;
    }

    if (target.cmd) {
        await FileHandler.openFile(target.cmd);
        return;
    }

    if (!target.exePath || !props.game.gamePath) {
        ElMessage.warning("当前游戏还没有配置安装目录。");
        return;
    }

    await FileHandler.runExe(
        await join(props.game.gamePath ?? "", target.exePath),
    );
}
</script>
<template>
    <Button
        v-if="typeof game.startExe === 'string'"
        variant="outline"
        @click="launchGame(game.startExe)">
        <Play class="h-4 w-4" />
        启动游戏
    </Button>
    <DropdownMenu v-else-if="Array.isArray(game.startExe)">
        <DropdownMenuTrigger>
            <Button variant="outline">
                <IconPlay class="h-4 w-4" />
                启动游戏
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
            <DropdownMenuItem
                v-for="item in game.startExe as IStartExe[]"
                :key="item.name"
                @click="launchGame(item as IStartExe)">
                <Play class="h-4 w-4" />
                {{ item.name }}
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>
<style scoped></style>
