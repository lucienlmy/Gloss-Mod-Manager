<script setup lang="ts">
import { open } from "@tauri-apps/plugin-dialog";
import { dirname, join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";

const manager = useManager();
const showSelectDialog = ref(false);

async function select(item: ISupportedGames) {
    const path = await ScanGame.getSteamGamePath(
        item.steamAppID,
        item.installdir,
    );
    console.log({ item, path });

    const selectGameByFolder = await PersistentStore.get(
        "selectGameByFolder",
        false,
    );
    const selected = await open({
        directory: selectGameByFolder,
        title: `请选择 ${item.gameExe} 所在位置`,
        filters: [{ name: "游戏主程序", extensions: ["exe"] }],
        defaultPath: path,
    });

    if (selected) {
        const folder = selectGameByFolder ? selected : await dirname(selected);
        const files = await FileHandler.getAllFilesInFolder(folder);

        if (typeof item.gameExe == "string") {
            // 判断 item.gameExe 是否存在于 files 中
            if (files.includes(item.gameExe)) {
                const managerGame = JSON.parse(
                    JSON.stringify(item),
                ) as ISupportedGames;
                managerGame.gamePath = folder;
                manager.managerGame = managerGame;
                // console.log(manager.managerGame);
            } else {
                ElMessage.error(`请选择 ${item.gameExe} 所在目录.`);
                return;
            }
        } else {
            // 判断 item.gameExe 是否存在于 files 中
            let exe = item.gameExe.find((item) => files.includes(item.name));
            if (exe) {
                // console.log(exe);
                const managerGame = item;
                managerGame.gamePath = await join(folder, exe.rootPath);
                manager.managerGame = managerGame;
            } else {
                let exename = item.gameExe
                    .map((item) => item.name)
                    .join(" 或 ");
                ElMessage.error(`请选择 ${exename} 所在目录.`);
                return;
            }
        }

        AppAnalytics.sendEvent(`switch_game`, item.gameName);

        const game = manager.managerGameList.find(
            (g) => g.gameName === item.gameName,
        );

        if (game) {
            manager.managerGameList = manager.managerGameList.map((g) => {
                if (g.gameName === item.gameName && manager.managerGame) {
                    return manager.managerGame;
                } else {
                    return g;
                }
            });
        } else {
            manager.managerGameList.push(manager.managerGame);
        }
        showSelectDialog.value = false;
    }
}
</script>
<template>
    <div class="select-game">
        <Dialog with-backdrop v-model:open="showSelectDialog">
            <DialogTrigger as-child>
                <Button variant="outline" size="sm">选择游戏</Button>
            </DialogTrigger>
            <DialogContent class="w-225 max-w-[70%]!">
                <DialogHeader>
                    <DialogTitle class="flex gap-3">
                        <div class="flex items-center">
                            选择游戏
                            <small
                                >(共{{
                                    manager.supportedGames.length
                                }}款游戏)</small
                            >
                        </div>
                        <div class="flex-1 max-w-[75%]">
                            <InputGroup>
                                <InputGroupInput
                                    placeholder="搜索游戏"></InputGroupInput>
                                <InputGroupAddon align="inline-end">
                                    <Button variant="ghost" size="icon">
                                        <IconSearch class="h-4 w-4" />
                                    </Button>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div
                    class="grid grid-cols-4 items-center gap-4 justify-items-center">
                    <div
                        v-for="item in manager.supportedGames"
                        :key="item.gameName"
                        @click="select(item)"
                        class="flex flex-col items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent/50 cursor-pointer">
                        <img
                            class="h-25"
                            :src="item.gameCoverImg"
                            :alt="item.gameName" />
                        <div>{{ item.gameName }}</div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
<style scoped></style>
