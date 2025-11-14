// NexusMods
import { defineStore } from "pinia";
import { ipcRenderer } from "electron";
import axios from "axios";

type IfacetsData = { [key: string]: number };

export const useNexusMods = defineStore("NexusMods", {
    state: () => ({
        mods: [] as INexusMods[],
        page: 1,
        pageSize: 24,
        count: 1,
        searchText: "",
        loading: false,
        categoryName: {} as IfacetsData,
        languageName: {} as IfacetsData,
        tag: {} as IfacetsData,
        facets: {
            categoryName: [] as string[],
            languageName: [] as string[],
            tag: [] as string[],
        },
        sort: {
            label: "Update time",
            value: { updatedAt: { direction: "DESC" } },
        },
    }),
    getters: {
        pageLength: (state) => Math.ceil(state.count / state.pageSize),
    },
    actions: {
        search() {
            this.page = 1;
            this.getModList();
        },
        getKey() {
            const user = useUser();
            return user.nexusModsUser.key;
        },
        async getheader() {
            return {
                apikey: this.getKey(),
                Accept: "application/json",
            };
        },
        async getModList() {
            const settings = useSettings();
            const query =
                "\n    query ModsListing($count: Int = 0, $facets: ModsFacet, $filter: ModsFilter, $offset: Int, $postFilter: ModsFilter, $sort: [ModsSort!]) {\n  mods(\n    count: $count\n    facets: $facets\n    filter: $filter\n    offset: $offset\n    postFilter: $postFilter\n    sort: $sort\n    viewUserBlockedContent: false\n  ) {\n    facetsData\n    nodes {\n      ...ModFragment\n    }\n    totalCount\n  }\n}\n    fragment ModFragment on Mod {\n  adultContent\n  createdAt\n  downloads\n  endorsements\n  fileSize\n  game {\n    domainName\n    id\n    name\n  }\n  modCategory {\n    categoryId\n    name\n  }\n  modId\n  name\n  status\n  summary\n  thumbnailUrl\n  uid\n  updatedAt\n  uploader {\n    avatar\n    memberId\n    name\n  }\n  viewerDownloaded\n  viewerEndorsed\n  viewerTracked\n  viewerUpdateAvailable\n}";
            const variables: any = {
                count: this.pageSize,
                facets: {
                    categoryName: this.facets.categoryName,
                    languageName: this.facets.languageName,
                    tag: this.facets.tag,
                },
                filter: {
                    gameDomainName: {
                        op: "EQUALS",
                        value: settings.settings.managerGame?.nexusMods
                            ?.game_domain_name,
                    },
                },
                offset: (this.page - 1) * this.pageSize,
                sort: this.sort.value,
            };

            if (this.searchText != "") {
                variables.filter.name = {
                    op: "WILDCARD",
                    value: this.searchText,
                };
            }

            this.loading = true;
            this.mods = [];
            const { data } = await axios.post(
                "https://api-router.nexusmods.com/graphql",
                {
                    query,
                    variables,
                },
                {
                    headers: await this.getheader(),
                }
            );
            this.loading = false;

            if (data.data) {
                this.mods = data.data.mods.nodes;
                this.count = data.data.mods.totalCount;
                this.categoryName = data.data.mods.facetsData.categoryName;
                this.languageName = data.data.mods.facetsData.languageName;
                this.tag = data.data.mods.facetsData.tag;
            }
        },
        async getFileList(mod: INexusMods) {
            let url = `https://api.nexusmods.com/v1/games/${mod.game.domainName}/mods/${mod.modId}/files.json`;

            const { data } = await axios.get(url, {
                headers: await this.getheader(),
            });

            const files: INexusModsFile[] = data.files;

            let primary_files = files.filter(
                (item) =>
                    item.category_name == "MAIN" ||
                    item.category_name == "OPTIONAL"
            );

            if (primary_files.length == 0) {
                primary_files = files;

                primary_files.sort(
                    (a, b) => b.uploaded_timestamp - a.uploaded_timestamp
                );
            }

            return primary_files;
        },
        async getModData(id: string, game_domain_name: string) {
            let url = `https://api.nexusmods.com/v1/games/${game_domain_name}/mods/${id}.json`;
            const { data } = await axios.get(url, {
                headers: await this.getheader(),
            });
            return data as INexusMods;
        },

        async getUserData() {
            const url = `https://api.nexusmods.com/v1/users/validate.json`;
            const { data } = await axios.get(url, {
                headers: await this.getheader(),
            });
            return data as INexusModsUser;
        },
    },
});
