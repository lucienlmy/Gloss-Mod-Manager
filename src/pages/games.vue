<script setup lang="ts">
import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";

const manager = useManager();
const router = useRouter();

function select(item: ISupportedGames) {
    manager.managerGame = item;

    router.push({ name: "/manager" });
}

function openGameFolder(item: ISupportedGames) {
    console.log(item);

    if (item.gamePath) {
        FileHandler.openFolder(item.gamePath);
    } else {
        ElMessage.error("游戏路径未找到");
    }
}

async function openModFolder(item: ISupportedGames) {
    const storagePath = (await PersistentStore.get("storagePath", "")) || "";
    const modFolder = await join(storagePath, "mods", item.gameName);
    FileHandler.openFolder(modFolder);
}

function deleteGame(item: ISupportedGames) {
    manager.managerGameList = manager.managerGameList.filter(
        (game) => game.gameName !== item.gameName,
    );
}
</script>
<template>
    <Card>
        <CardHeader>
            <CardTitle class="flex items-center gap-4">
                游戏库 <SelectGame />
            </CardTitle>
        </CardHeader>
        <CardContent
            class="grid grid-cols-4 items-center gap-4 justify-items-center"
        >
            <div
                v-for="item in manager.managerGameList"
                :key="item.gameName"
                class="flex flex-col items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent/50"
            >
                <img
                    :src="item.gameCoverImg"
                    :alt="item.gameName"
                    @click="select(item)"
                    class="h-25 hover:bg-accent/50 cursor-pointer"
                />
                <div>{{ $t(item.gameName) }}</div>
                <div class="flex w-full items-center justify-between gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button variant="outline" size="icon">
                                <IconMenu class="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem @click="openGameFolder(item)"
                                >打开游戏目录</DropdownMenuItem
                            >
                            <DropdownMenuItem @click="openModFolder(item)"
                                >打开Mod目录</DropdownMenuItem
                            >
                            <DropdownMenuItem @click="deleteGame(item)"
                                >删除</DropdownMenuItem
                            >
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <StartGame :game="item" />
                </div>
            </div>
        </CardContent>
    </Card>
</template>
<style scoped></style>
