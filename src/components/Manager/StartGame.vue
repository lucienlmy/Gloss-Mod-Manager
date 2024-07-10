<script lang='ts' setup>
import { join } from 'path';
import { spawn, exec } from 'child_process';
import { FileHandler } from '@src/model/FileHandler';
import { ElMessage } from 'element-plus';
import { ISupportedGames } from '@src/model/Interfaces';

const props = defineProps<{
    game: ISupportedGames
}>()


async function startGame(startExe: string) {
    // let startExe = game?.startExe
    if (startExe) {
        // 判断 startExe 里面是否包含 steam 
        if (startExe.includes('steam://rungameid')) {
            exec(`start ${startExe}`)
        } else {
            startExe = join(props.game?.gamePath ?? "", startExe)
            // console.log(startExe);
            FileHandler.runExe(startExe)
        }
        ElMessage.success("启动成功~")
    }
}


</script>
<template>
    <template v-if="game?.startExe">
        <v-chip label variant="text" v-if="typeof (game.startExe) == 'string'"
            @click="startGame(game.startExe as string)" append-icon="mdi-menu-right">{{ $t("Launch Game") }}</v-chip>
        <v-menu v-else open-on-hover>
            <template v-slot:activator="{ props }">
                <v-chip label variant="text" v-bind="props" @click="1" append-icon="mdi-menu-right">
                    {{ $t('Launch Game') }}
                </v-chip>
            </template>
            <v-card>
                <v-list>
                    <v-list-item v-for="item in game.startExe" :title="$t(item.name)"
                        @click="startGame(item.exePath)"></v-list-item>
                </v-list>
            </v-card>
        </v-menu>
    </template>
</template>
<script lang='ts'>

export default {
    name: 'StartGame',
}
</script>
<style lang='less' scoped></style>