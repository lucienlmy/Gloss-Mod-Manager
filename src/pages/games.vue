<script setup lang="ts">
import { join } from "@tauri-apps/api/path";
import { ElMessage } from "element-plus-message";
import { useI18n } from "vue-i18n";

const manager = useManager();
const router = useRouter();
const { t } = useI18n();

function select(item: ISupportedGames) {
    const resolvedGame =
        manager.supportedGames.find((game) => {
            return game.GlossGameId === item.GlossGameId;
        }) ??
        manager.supportedGames.find((game) => {
            return game.gameName === item.gameName;
        }) ??
        item;

    manager.managerGame = {
        ...resolvedGame,
        ...item,
    };

    router.push({ name: "/manager" });
}

function openGameFolder(item: ISupportedGames) {
    console.log(item);

    if (item.gamePath) {
        FileHandler.openFolder(item.gamePath);
    } else {
        ElMessage.error(t("games.notFound"));
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
                {{ t("games.library") }}
                <div class="flex flex-wrap items-center gap-2">
                    <SelectGame />
                    <CustomGameDialog />
                </div>
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
                                >{{ t("games.openGameFolder") }}</DropdownMenuItem
                            >
                            <DropdownMenuItem @click="openModFolder(item)"
                                >{{ t("games.openModFolder") }}</DropdownMenuItem
                            >
                            <DropdownMenuItem @click="deleteGame(item)"
                                >{{ t("common.delete") }}</DropdownMenuItem
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
