import { getAllExpands } from "@/Expands";
import { PersistentStore } from "@/lib/persistent-store";
import { ref } from "vue";

export const useManager = defineStore("Manager", () => {
    const supportedGames = ref<ISupportedGames[]>([]);
    const managerModList = ref<IModInfo[]>([]);
    const search = ref("");
    const textCollator = new Intl.Collator("zh-CN", {
        numeric: true,
        sensitivity: "base",
    });

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
    const tags = ref<ITag[]>([]);
    const managerRoot = ref("");
    const selectionMode = ref(false);
    const selectionIds = ref<number[]>([]);

    function sortModsByWeight(list: IModInfo[]) {
        return list
            .map((mod, index) => ({
                mod,
                index,
            }))
            .sort((left, right) => {
                const leftWeight =
                    Number.isFinite(left.mod.weight) ? left.mod.weight : 0;
                const rightWeight =
                    Number.isFinite(right.mod.weight) ? right.mod.weight : 0;
                const weightDiff = leftWeight - rightWeight;

                if (weightDiff !== 0) {
                    return weightDiff;
                }

                return left.index - right.index;
            })
            .map(({ mod }) => mod);
    }

    const filteredMods = computed<IModInfo[]>(() => {
        const keyword = search.value.trim().toLowerCase();

        return sortModsByWeight(managerModList.value)
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
    const selectedMods = computed<IModInfo[]>(() => {
        const selectedIdSet = new Set(selectionIds.value);

        return sortModsByWeight(managerModList.value).filter((mod) => {
            return selectedIdSet.has(mod.id);
        });
    });

    function setSelection(ids: number[]) {
        const existingIdSet = new Set(
            managerModList.value.map((mod) => mod.id),
        );
        selectionIds.value = [...new Set(ids)].filter((id) => {
            return existingIdSet.has(id);
        });
    }

    function clearSelection() {
        selectionIds.value = [];
    }

    function toggleSelection(modId: number, selected?: boolean) {
        const selectedIdSet = new Set(selectionIds.value);
        const shouldSelect = selected ?? !selectedIdSet.has(modId);

        if (shouldSelect) {
            selectedIdSet.add(modId);
        } else {
            selectedIdSet.delete(modId);
        }

        setSelection([...selectedIdSet]);
    }

    function selectAllVisible() {
        setSelection(filteredMods.value.map((mod) => mod.id));
    }

    function invertVisibleSelection() {
        const selectedIdSet = new Set(selectionIds.value);
        const nextIds = filteredMods.value
            .filter((mod) => !selectedIdSet.has(mod.id))
            .map((mod) => mod.id);

        setSelection(nextIds);
    }

    function retainVisibleSelection() {
        const visibleIdSet = new Set(filteredMods.value.map((mod) => mod.id));

        selectionIds.value = selectionIds.value.filter((id) => {
            return visibleIdSet.has(id);
        });
    }

    function getTypeName(typeId: IModInfo["modType"]) {
        const type = availableTypes.value.find(
            (item) => String(item.id) === String(typeId ?? ""),
        );

        return type?.name ?? "未分类";
    }

    async function saveManagerData() {
        if (!managerRoot.value) {
            return;
        }

        const normalizedMods = sortModsByWeight(managerModList.value).map(
            (mod, index) => ({
                ...mod,
                weight: index + 1,
            }),
        );

        managerModList.value = normalizedMods;
        await Manager.saveModInfo(normalizedMods, managerRoot.value);
        await Manager.saveModInfo(tags.value, managerRoot.value, "tags.json");
    }

    void Promise.all(getAllExpands())
        .then(async (games) => {
            supportedGames.value = games;
            if (managerGame.value) {
                const matchedGame = games.find(
                    (game) =>
                        game.GlossGameId === managerGame.value?.GlossGameId,
                );
                if (matchedGame) {
                    managerGame.value.modType = matchedGame.modType;
                    managerGame.value.checkModType = matchedGame.checkModType;
                }
            }
        })
        .catch((error: unknown) => {
            console.error("加载游戏扩展失败");
            console.error(error);
        });

    watch(selectionMode, (enabled) => {
        if (!enabled) {
            clearSelection();
        }
    });

    watch(managerModList, () => {
        setSelection(selectionIds.value);
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
        tags,
        textCollator,
        availableTypes,
        getTypeName,
        managerRoot,
        selectionMode,
        selectionIds,
        selectedMods,
        setSelection,
        clearSelection,
        toggleSelection,
        selectAllVisible,
        invertVisibleSelection,
        retainVisibleSelection,
        saveManagerData,
    };
});
