<script lang='ts' setup>
import type { ISupportedGames } from "@src/model/Interfaces"
import { useSettings } from "@src/stores/useSettings"
import { useRouter } from "vue-router"
import StartGame from '@src/components/Manager/StartGame.vue'
import { FileHandler } from "@src/model/FileHandler"
import { join } from 'path'
import { useManager } from "@src/stores/useManager"

const props = defineProps<{
    item: ISupportedGames
}>()

const settings = useSettings()
const manager = useManager()
const router = useRouter()

function ChangeGame() {
    let sgame = manager.supportedGames.find(item => item.GlossGameId == props.item.GlossGameId)

    settings.settings.managerGame = {
        ...props.item,
        ...sgame
    }
    router.push({ name: 'Manager' })
}

function Delete() {
    settings.settings.managerGameList = settings.settings.managerGameList.filter(item => item.GlossGameId !== props.item.GlossGameId)
}

function openGameFolder() {
    FileHandler.openFolder(props.item.gamePath ?? "")
}

function openModFolder() {
    FileHandler.openFolder(join(settings.settings.modStorageLocation, props.item.gameName))
}

</script>
<template>
    <v-card>
        <v-img class="cover" @click="ChangeGame" :aspect-ratio="16 / 9" :src="item.gameCoverImg"></v-img>
        <v-card-text>{{ $t(item.gameName) }}</v-card-text>
        <v-card-actions class="actions">
            <v-menu open-on-hover>
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props">
                        <v-icon>mdi-menu</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item :title="$t('Open Mod Folder')" @click="openModFolder"
                        append-icon="mdi-folder-open-outline"></v-list-item>
                    <v-list-item :title="$t('Open Game Folder')" @click="openGameFolder"
                        append-icon="mdi-folder-open-outline"></v-list-item>
                    <v-list-item @click="Delete" append-icon="mdi-delete-outline">{{ $t("Delete") }}</v-list-item>
                </v-list>
            </v-menu>
            <StartGame :game="item"></StartGame>
        </v-card-actions>
    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'GameList',
}
</script>
<style lang='less' scoped>
.cover {
    cursor: pointer;

    &:hover {
        opacity: 0.8;
    }
}

.actions {
    display: flex;
    justify-content: space-between;
}
</style>