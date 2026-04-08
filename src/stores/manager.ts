import { getAllExpands } from "@/Expands";
import { Manager } from "@/lib/Manager";
import { PersistentStore } from "@/lib/persistent-store";

const SELECTED_GAME_STORAGE_KEY = "gmm:selected-game-id";
const MOD_STORAGE_LOCATION_KEY = "gmm:mod-storage-location";
const GAME_STORAGE_MAP_KEY = "gmm:game-storage-map";
const CLOSE_SOFT_LINKS_KEY = "gmm:close-soft-links";

export const useManager = defineStore("Manager", () => {
    const supportedGames = ref(getAllExpands() as ISupportedGames[]);
    const managerModList = ref([] as IModInfo[]);
    const tags = ref([] as ITag[]);
    const filterTags = ref([] as ITag[]);
    const selectGameDialog = ref(false);
    const maxID = ref(0);
    const filterType = ref(0);
    const search = ref("");
    const dragIndex = ref(0);
    const installLoading = ref(false);
    const selectionMode = ref(false);
    const selectionList = ref([] as IModInfo[]);
    const runing = ref(false);
    const showShare = ref(false);
    const shareList = ref([] as IModInfo[]);
    const custonTypes = ref({
        showEdit: false,
        formData: {
            name: "",
            installPath: "",
            install: {
                UseFunction: "Unknown",
                folderName: "",
                isInstall: true,
                include: false,
                spare: false,
                keepPath: false,
                isExtname: false,
                inGameStorage: true,
            },
            local: true,
            uninstall: {
                UseFunction: "Unknown",
                folderName: "",
                isInstall: false,
                include: false,
                spare: false,
                keepPath: false,
                isExtname: false,
                inGameStorage: true,
            },
            checkModType: {
                UseFunction: "extname",
                Keyword: [],
            },
        } as IExpandsType,
    });

    const selectedGameId = PersistentStore.useValue<number | null>(
        SELECTED_GAME_STORAGE_KEY,
        supportedGames.value[0]?.GlossGameId ?? null,
    );
    const modStorageLocation = PersistentStore.useValue<string>(
        MOD_STORAGE_LOCATION_KEY,
        "",
    );
    const gameStorageMap = PersistentStore.useValue<Record<string, string>>(
        GAME_STORAGE_MAP_KEY,
        {},
    );
    const closeSoftLinks = PersistentStore.useValue<boolean>(
        CLOSE_SOFT_LINKS_KEY,
        true,
    );

    const managerGameList = computed(() => supportedGames.value);
    const managerGame = computed(() => {
        if (selectedGameId.value === null) {
            return null;
        }

        return (
            supportedGames.value.find(
                (item) => item.GlossGameId === selectedGameId.value,
            ) ?? null
        );
    });
    const managerGameStorage = computed(() => {
        const game = managerGame.value;

        if (!game) {
            return "";
        }

        return (
            gameStorageMap.value[String(game.GlossGameId)] ||
            game.gamePath ||
            game.installdir ||
            ""
        );
    });
    const effectiveModStorageLabel = computed(
        () =>
            modStorageLocation.value.trim() ||
            "应用默认目录（appLocalDataDir/mods）",
    );
    const installModeLabel = computed(() =>
        closeSoftLinks.value ? "复制模式" : "链接优先模式",
    );

    function setCurrentGame(gameId: number | null) {
        selectedGameId.value = gameId;
    }

    function setManagerGameStorage(path: string) {
        const game = managerGame.value;

        if (!game) {
            return;
        }

        const key = String(game.GlossGameId);
        const nextPath = path.trim();
        const nextMap = { ...gameStorageMap.value };

        if (nextPath) {
            nextMap[key] = nextPath;
        } else {
            delete nextMap[key];
        }

        gameStorageMap.value = nextMap;
    }

    function applyGameDefaultPath() {
        const game = managerGame.value;

        if (!game) {
            return;
        }

        setManagerGameStorage(game.installdir || game.gamePath || "");
    }

    function resetManagerGameStorage() {
        setManagerGameStorage("");
    }

    function setModStorageLocation(path: string) {
        modStorageLocation.value = path.trim();
    }

    function setCloseSoftLinks(value: boolean) {
        closeSoftLinks.value = value;
    }

    function ensureSelectedGameValid(games = supportedGames.value) {
        if (games.length === 0) {
            if (selectedGameId.value !== null) {
                selectedGameId.value = null;
            }

            return;
        }

        if (
            selectedGameId.value === null ||
            !games.some((item) => item.GlossGameId === selectedGameId.value)
        ) {
            selectedGameId.value = games[0].GlossGameId;
        }
    }

    watch(
        supportedGames,
        (games) => {
            ensureSelectedGameValid(games);
        },
        { immediate: true },
    );

    watch(selectedGameId, () => {
        ensureSelectedGameValid();
    });

    watch(
        [managerGameStorage, modStorageLocation, closeSoftLinks],
        ([gameStorage, modStorage, linksEnabled]) => {
            Manager.configureContext({
                gameStorage: gameStorage.trim(),
                modStorage: modStorage.trim(),
                closeSoftLinks: linksEnabled,
            });
        },
        { immediate: true },
    );

    return {
        supportedGames,
        managerModList,
        tags,
        filterTags,
        selectGameDialog,
        maxID,
        filterType,
        search,
        dragIndex,
        installLoading,
        selectionMode,
        selectionList,
        runing,
        showShare,
        shareList,
        custonTypes,
        selectedGameId,
        managerGameList,
        managerGame,
        managerGameStorage,
        modStorageLocation,
        closeSoftLinks,
        effectiveModStorageLabel,
        installModeLabel,
        setCurrentGame,
        setManagerGameStorage,
        applyGameDefaultPath,
        resetManagerGameStorage,
        setModStorageLocation,
        setCloseSoftLinks,
    };
});
