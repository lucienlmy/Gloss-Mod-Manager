import { getAllExpands } from "@/Expands";

export const useManager = defineStore("Manager", {
    state: () => ({
        supportedGames: getAllExpands() as ISupportedGames[],
        managerModList: [] as IModInfo[],
        tags: [] as ITag[],
        filterTags: [] as ITag[],
        selectGameDialog: false,
        maxID: 0,
        filterType: 0 as number,
        search: "",
        dragIndex: 0,
        installLoading: false,
        selectionMode: false,
        selectionList: [] as IModInfo[],
        runing: false,
        showShare: false,
        shareList: [] as IModInfo[],
        custonTypes: {
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
        },
    }),
    getters: {},
});
