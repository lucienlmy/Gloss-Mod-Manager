<script setup lang="ts">
import { open } from "@tauri-apps/plugin-dialog";
import { appDataDir } from "@tauri-apps/api/path";

const manager = useManager();
const showSelectDialog = ref(false);

async function select(item: ISupportedGames) {
    const path = await ScanGame.getSteamGamePath(
        item.steamAppID,
        item.installdir,
    );

    const selected = await open({
        directory: false,
        title: `请选择 ${item.gameExe} 所在位置`,
        filters: [{ name: "游戏主程序", extensions: ["exe"] }],
        defaultPath: path || (await appDataDir()),
    });

    console.log(selected);
    showSelectDialog.value = false;
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
                        <div class="flex-1">
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
