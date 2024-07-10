import type { IModIo, IModIoModfile } from "@src/model/Interfaces";
import { defineStore } from "pinia";
import { useSettings } from "@src/stores/useSettings";


export const useModIo = defineStore('ModIo', {
    state: () => ({
        modList: [] as IModIo[],
        loading: false,
        page: 1,
        pageSize: 24,
        filter: {
            sort_by: "downloads" as "downloads" | "popular" | "rating" | "subscribers",
            tags: "",
            searchText: "",
        },
        count: 1,
        selected: {
            id: 0,
            data: undefined as IModIo | undefined,
        },
        gameTags: [] as any[]
    }),
    getters: {
        pageLength: (state) => Math.ceil(state.count / state.pageSize),
    },
    actions: {
        async getModList() {
            this.loading = true
            const settings = useSettings()
            let game_id = settings.settings.managerGame?.mod_io

            if (game_id) {

                let params = new URLSearchParams({
                    api_key: '10356e364c5af111af2e4a956a1506df',
                    maturity_option: '0',
                    _sort: this.filter.sort_by,
                    'tags-in': this.filter.tags,
                    _q: this.filter.searchText,
                    _limit: this.pageSize.toString(),
                    _offset: ((this.page - 1) * this.pageSize).toString(),
                })

                // console.log(params.toString());


                let response = await fetch(`https://u-24301997.modapi.io/v1/games/${game_id}/mods?${params}`, {
                    headers: {
                        'Accept-Encoding': 'gzip',
                        'Accept': 'application/json',
                    }
                })

                let data = await response.json()

                this.modList = data.data
                this.count = data.result_total

            }

            this.loading = false
        },
        search() {
            this.page = 1
            this.getModList()
        },
        async getModDataById(id: number) {
            let data = this.modList.find(x => x.id == id)
            if (data) {
                this.selected.data = data
            } else {
                const settings = useSettings()
                let game_id = settings.settings.managerGame?.mod_io

                if (game_id) {
                    // console.log(game_id, id);
                    let params = new URLSearchParams({
                        api_key: '10356e364c5af111af2e4a956a1506df',
                    })
                    let response = await fetch(`https://u-24301997.modapi.io/v1/games/${game_id}/mods/${id}?${params}`, {
                        headers: {
                            'Accept-Encoding': 'gzip',
                            'Accept': 'application/json',
                        }
                    })

                    data = await response.json()

                    let file = await this.getModFile(game_id, id)

                    console.log(file);

                    data!.modfile = file[0]
                    this.selected.data = data
                }
            }

            return data
        },
        async getGameTags() {
            const settings = useSettings()
            let game_id = settings.settings.managerGame?.mod_io

            if (game_id) {
                let params = new URLSearchParams({
                    api_key: '10356e364c5af111af2e4a956a1506df',
                })

                let response = await fetch(`https://u-24301997.modapi.io/v1/games/${game_id}?${params}`, {
                    headers: {
                        'Accept-Encoding': 'gzip',
                        'Accept': 'application/json',
                    }
                })

                let data = await response.json()

                this.gameTags = data.tag_options[0].tags
            }
        },
        async getModFile(game_id: number, id: number) {
            let params = new URLSearchParams({
                api_key: '10356e364c5af111af2e4a956a1506df',
            })
            let response = await fetch(`https://u-24301997.modapi.io/v1/games/${game_id}/mods/${id}/files?${params}`, {
                headers: {
                    'Accept-Encoding': 'gzip',
                    'Accept': 'application/json',
                }
            })

            let data = await response.json()

            return data.data as IModIoModfile[]
        }
    }
})