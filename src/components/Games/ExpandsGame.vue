<script lang='ts' setup>
const games = useGames()

const form = ref({} as IExpandsSupportedGames)
const moreGameExe = ref(false)
const visible = ref(false)

const startExe = ref({} as IStartExe)

watch(moreGameExe, () => {
    form.value.startExe = moreGameExe.value ? [] : ''
}, { immediate: true })

function addstartExe() {
    console.log(form.value.startExe, typeof (form.value.startExe));

    if (typeof (form.value.startExe) == 'object') {
        form.value.startExe.push(startExe.value)
        startExe.value = {} as IStartExe
    }
}

</script>
<template>
    <v-dialog v-model="games.showExpandsGame" persistent width="500px">
        <el-card>
            <template #header>
                <div class="header">
                    <h3>添加游戏</h3>
                    <el-button @click="games.showExpandsGame = false">
                        <el-icon><el-icon-close></el-icon-close></el-icon> </el-button>
                </div>
            </template>
            <el-form label-width="100">
                <el-form-item label="游戏ID">
                    <el-input type="number" v-model="form.GlossGameId" placeholder="3DN Mod站的游戏ID">
                        <template #append>
                            <el-link href="https://mod.3dmgame.com/read/100" :underline="false"
                                target="_blank"><v-icon>mdi-help</v-icon></el-link>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item label="Steam Id">
                    <el-input type="number" v-model="form.steamAppID" placeholder="游戏在Steam中的AppId, 没有则填 0"></el-input>
                </el-form-item>
                <el-form-item label="安装目录">
                    <el-input v-model="form.installdir" placeholder="游戏安装目录, string 类型"></el-input>
                </el-form-item>
                <el-form-item label="游戏名称">
                    <el-input v-model="form.gameName" placeholder="游戏名称, 尽量使用英文"></el-input>
                </el-form-item>
                <el-form-item label="主程序名称">
                    <el-row>
                        <el-col :span="24">
                            <el-switch v-model="moreGameExe" inline-prompt
                                style="--el-switch-on-color: #FF6F00; --el-switch-off-color: #1565C0" active-text="高级"
                                inactive-text="简易" />
                        </el-col>
                        <el-col :span="24" v-if="moreGameExe" class="star-exe">
                            <el-popover trigger="click" :width="250" :teleported="false">
                                <template #reference>
                                    <el-button link @click="visible = true"
                                        class="star-exe-list">添加<el-icon><el-icon-plus></el-icon-plus></el-icon></el-button>
                                </template>
                                <v-card color="#0000">
                                    <el-form label-width="80">
                                        <el-form-item label="名称">
                                            <el-input v-model="startExe.name" placeholder="显示的名称"></el-input>
                                        </el-form-item>
                                        <el-form-item label="路径">
                                            <el-input v-model="startExe.exePath" placeholder="根目录的相对路径"></el-input>
                                        </el-form-item>
                                        <el-form-item label="启动选项">
                                            <el-input v-model="startExe.options" placeholder="启动项"></el-input>
                                        </el-form-item>
                                    </el-form>
                                    <template #actions>
                                        <el-button @click="addstartExe">添加</el-button>
                                    </template>
                                </v-card>
                            </el-popover>
                            <div class="star-exe-list" v-for="item in (form.startExe as IStartExe[])" :key="item.name">
                                {{ item.name }}
                            </div>
                        </el-col>
                        <el-col :span="24" v-else>
                            <el-input v-model="(form.gameExe as string)" placeholder="游戏 exe 名称"></el-input>
                        </el-col>
                    </el-row>
                </el-form-item>
            </el-form>
        </el-card>
    </v-dialog>
</template>
<script lang='ts'>

export default {
    name: 'ExpandsGame',
}
</script>
<style lang='less' scoped>
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.star-exe {
    display: flex;

    .star-exe-list {
        margin-right: 10px;
    }
}
</style>
