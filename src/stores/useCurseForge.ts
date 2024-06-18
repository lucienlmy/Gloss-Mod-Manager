import { defineStore } from "pinia";
import axios from "axios";

import type { ICurseForgeMod } from "@src/model/Interfaces";
import { useSettings } from "./useSettings";


export const useCurseForge = defineStore('CurseForge', {
    state: () => ({
        mods: [] as ICurseForgeMod[],
        searchFilter: '',
        sortField: 3,
        pageSize: 24,
        page: 1,
        gameVersions: [] as string[],
        categoryIds: [] as number[],
        totalCount: 1,
        modData: undefined as ICurseForgeMod | undefined,
        loading: false
    }),
    getters: {
        totalPage(state) {
            return Math.ceil(state.totalCount / state.pageSize)
        }
    },
    actions: {
        async GetModList() {
            let url = 'https://api.curseforge.com/v1/mods/search'
            const { searchFilter, sortField, pageSize, page, gameVersions, categoryIds } = this

            const settings = useSettings()
            const gameId = settings.settings.managerGame?.curseforge || ''
            let index = (page - 1) * pageSize

            let data = new URLSearchParams({
                searchFilter,
                sortField: sortField.toString(),
                gameId: gameId.toString(),
                pageSize: pageSize.toString(),
                index: index.toString(),
                // gameVersions: gameVersions.join(','),
                // categoryIds: categoryIds.join(',')
            })

            this.loading = true

            axios.get(`${url}?${data}`, {
                headers: {
                    'x-api-key': '$2a$10$0HYeGEow42aLsJ3gN0620eb7OYXY8MTR/S2H9tmFm71.1T0nDFRTe',
                    'Accept': 'application/json'
                }
            }).then(({ data }) => {
                this.mods = data.data
                this.totalCount = data.pagination.totalCount

                this.loading = false
            })
        },
        async GetModDataById(id: number | string) {
            let mod = this.mods.find(mod => mod.id == id)
            if (!mod) {
                let url = `https://api.curseforge.com/v1/mods/${id}`
                let { data } = await axios.get(url, {
                    headers: {
                        'x-api-key': '$2a$10$0HYeGEow42aLsJ3gN0620eb7OYXY8MTR/S2H9tmFm71.1T0nDFRTe',
                        'Accept': 'application/json'
                    }
                })
                mod = data.data
            }
            if (mod) this.modData = mod
            return mod
        },
        async GetModDescription(id: string) {
            let { data } = await axios.get(`https://api.curseforge.com/v1/mods/${id}/description`, {
                headers: {
                    'x-api-key': '$2a$10$0HYeGEow42aLsJ3gN0620eb7OYXY8MTR/S2H9tmFm71.1T0nDFRTe',
                    'Accept': 'application/json'
                }
            })

            return data.data
        }
    }
})