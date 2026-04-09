import { getAllExpands } from "@/Expands";

export const useManager = defineStore("Manager", () => {
    const supportedGames = ref<ISupportedGames[]>([]);
    const managerModList = ref([] as IModInfo[]);

    const managerGame = PersistentStore.useValue<ISupportedGames | null>(
        "managerGame",
        null,
    );
    const managerGameList = PersistentStore.useValue<ISupportedGames[]>(
        "managerGameList",
        [],
    );

    getAllExpands().forEach(async (gamePromise) => {
        supportedGames.value.push(await gamePromise);
    });

    return {
        supportedGames,
        managerModList,
        managerGame,
        managerGameList,
    };
});
