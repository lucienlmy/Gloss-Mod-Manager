import { getAllExpands } from "@/Expands";
import { PersistentStore } from "@/lib/persistent-store";
import { ref } from "vue";

export const useManager = defineStore("Manager", () => {
    const supportedGames = ref<ISupportedGames[]>([]);
    const managerModList = ref<IModInfo[]>([]);
    const search = ref("");

    const managerGame = PersistentStore.useValue<ISupportedGames | null>(
        "managerGame",
        null,
    );
    const managerGameList = PersistentStore.useValue<ISupportedGames[]>(
        "managerGameList",
        [],
    );

    const selectedType = ref<number | string | 0>(0);
    const selectedTag = ref("全部");
    const sortKey = ref<ManagerSortKey>("weight");
    const tags = ref<ITag[]>([]);
    const filterInstalled = ref(false);

    const filteredMods = computed(() => {
        const keyword = search.value.trim().toLowerCase();

        return [...managerModList.value]
            .filter((mod) => {
                if (selectedType.value === 0) {
                    return true;
                }

                return String(mod.modType ?? "") === String(selectedType.value);
            })
            .filter((mod) => {
                if (selectedTag.value === "全部") {
                    return true;
                }

                return (mod.tags ?? []).some(
                    (tag) => tag.name === selectedTag.value,
                );
            })
            .filter((mod) => {
                if (!filterInstalled.value) {
                    return true;
                }

                return mod.isInstalled;
            })
            .filter((mod) => {
                if (!keyword) {
                    return true;
                }

                const joinedTags = (mod.tags ?? [])
                    .map((tag) => tag.name)
                    .join(" ");
                const joinedText = [
                    mod.modName,
                    mod.modAuthor ?? "",
                    mod.modVersion,
                    mod.fileName,
                    mod.modDesc ?? "",
                    joinedTags,
                    getTypeName(mod.modType),
                ]
                    .join(" ")
                    .toLowerCase();

                return joinedText.includes(keyword);
            });
    });

    const availableTypes = computed(() => managerGame.value?.modType ?? []);

    const textCollator = new Intl.Collator("zh-CN", {
        numeric: true,
        sensitivity: "base",
    });

    function getTypeName(typeId: IModInfo["modType"]) {
        const type = availableTypes.value.find(
            (item) => String(item.id) === String(typeId ?? ""),
        );

        return type?.name ?? "未分类";
    }

    void Promise.all(getAllExpands())
        .then((games) => {
            supportedGames.value = games;
        })
        .catch((error: unknown) => {
            console.error("加载游戏扩展失败");
            console.error(error);
        });

    return {
        supportedGames,
        managerModList,
        managerGame,
        managerGameList,
        filteredMods,
        search,
        selectedType,
        selectedTag,
        sortKey,
        tags,
        textCollator,
        filterInstalled,
        availableTypes,
        getTypeName,
    };
});
