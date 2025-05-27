<script lang='ts' setup>
import { computed, watch, ref } from "vue";
import { ElMessage, ElMessageBox } from 'element-plus';
import ContentModMenu from '@/views/Manager/Content/ModMenu.vue'

const props = defineProps<{
    mod: IModInfo,
    index: number
}>()

const manager = useManager()
const settings = useSettings()

let loading = ref(false)

// 自动滚动相关变量
let autoScrollId = ref<number | null>(null);
let scrollSpeed = ref(0);
let scrollDirection = ref('');

let type = computed<IType | undefined>(() => {
    return settings.settings.managerGame?.modType.find((item) => {
        return item.id == props.mod.modType
    })
})

watch(() => props.mod.isInstalled, () => {

    loading.value = true

    if (props.mod.isInstalled) {
        FileHandler.writeLog(`Install: ${props.mod.modName}`)
        // AppAnalytics.sendEvent("install", `webid: ${props.mod.webId}`)
        // 安装
        if (typeof (type.value?.install) == 'function') {
            type.value?.install(props.mod).then(res => {
                if (typeof (res) == 'boolean' && res == false) {
                    props.mod.isInstalled = false
                }
                loading.value = false
            }).catch(err => {
                console.log(err);
                ElMessage.error(`错误: ${err}`)
                loading.value = false
            })
        }
    } else {
        FileHandler.writeLog(`Uninstall: ${props.mod.modName}`)
        // 卸载
        if (typeof (type.value?.uninstall) == 'function') {
            type.value?.uninstall(props.mod).then(res => {
                if (typeof (res) == 'boolean' && res == false) {
                    props.mod.isInstalled = false
                }
                loading.value = false
            }).catch(err => {
                console.log(err);
                ElMessage.error(`错误: ${err}`)
                loading.value = false
            })
        }
    }
})

let modType = computed({
    get: () => props.mod.modType,
    set: (value) => {
        if (props.mod.modType != 99) {
            ElMessageBox.confirm(`除非你真的知道自己在做什么, 否则不要随意修改类型, 不然会导致Mod失效!`).then(() => {
                props.mod.modType = value
            }).catch(() => {
                // props.mod.modType = ondValue
            })
        } else {
            props.mod.modType = value
        }
    }
})

let exit_name = ref(false)

//#region 拖拽
function dragstart(e: any, index: number) {
    e.stopPropagation()

    manager.dragIndex = index
    setTimeout(() => {
        e.target.classList.add('moveing')
    }, 0)

    // 开始监听拖拽过程中的鼠标移动
    document.addEventListener('dragover', handleDragScroll);
}

function handleDragScroll(e: any) {
    const scrollThresholdTop = 350; // 触发滚动的边缘距离
    const scrollThresholdDown = 60; // 触发滚动的边缘距离
    const maxScrollSpeed = 15; // 最大滚动速度

    // 获取视口高度
    const viewportHeight = window.innerHeight;
    // 获取鼠标位置
    const mouseY = e.clientY;

    // 判断是否在页面顶部或底部边缘
    if (mouseY < scrollThresholdTop) {
        // 靠近顶部，向上滚动
        scrollDirection.value = 'up';
        // 计算滚动速度，越靠近边缘速度越快
        scrollSpeed.value = Math.ceil((scrollThresholdTop - mouseY) / scrollThresholdTop * maxScrollSpeed);
        startAutoScroll();
    } else if (mouseY > viewportHeight - scrollThresholdDown) {
        // 靠近底部，向下滚动
        scrollDirection.value = 'down';
        // 计算滚动速度
        scrollSpeed.value = Math.ceil((mouseY - (viewportHeight - scrollThresholdDown)) / scrollThresholdDown * maxScrollSpeed);
        startAutoScroll();
    } else {
        // 不在边缘，停止滚动
        stopAutoScroll();
    }
}

function startAutoScroll() {
    // 如果已经在滚动，不重复启动
    if (autoScrollId.value !== null) return;

    autoScrollId.value = window.setInterval(() => {
        if (scrollDirection.value === 'up') {
            window.scrollBy(0, -scrollSpeed.value);
        } else {
            window.scrollBy(0, scrollSpeed.value);
        }
    }, 16); // 约60fps
}

function stopAutoScroll() {
    if (autoScrollId.value !== null) {
        window.clearInterval(autoScrollId.value);
        autoScrollId.value = null;
    }
}

function dragenter(e: any, index: number, mod: IModInfo) {
    e.preventDefault()
    // 拖拽到原位置时不触发
    if (manager.dragIndex !== index) {

        const source = manager.managerModList[manager.dragIndex];

        manager.managerModList.splice(manager.dragIndex, 1);
        manager.managerModList.splice(index, 0, source);

        // 更新节点位置
        manager.dragIndex = index
    }
}
function dragover(e: any) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
}
function dragend(e: any) {
    e.target.classList.remove('moveing')
    // 停止自动滚动并移除事件监听
    stopAutoScroll();
    document.removeEventListener('dragover', handleDragScroll);
}

function list_dragover(e: any) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
}

function list_drop(e: any) {
    e.preventDefault()
    let name = e.dataTransfer.getData('name');
    let color = e.dataTransfer.getData('color');
    if (name && color) {
        if (!props.mod.tags) {
            props.mod.tags = []
        }
        if (props.mod.tags?.findIndex(item => item.name == name) == -1) {
            props.mod.tags.push({
                name: name,
                color: color
            })
        } else {
            // 移除 
            props.mod.tags = props.mod.tags.filter(item => item.name != name)
        }
    }
}
//#endregion



async function checkModType() {
    if (!props.mod.modType) {
        if (typeof (settings.settings.managerGame?.checkModType) == "function") {
            const extype = ExpandsType.checkModType(settings.settings.managerGame.gameName, props.mod.modFiles)
            if (extype) {
                props.mod.modType = extype
            } else {
                props.mod.modType = await settings.settings.managerGame?.checkModType(props.mod)
            }
        }
    }
}

checkModType()
</script>
<template>
    <div class="wrap" v-if="mod?.id" :class="{ 'new-version': mod.isUpdate }">
        <el-col :span="24">
            <!-- 小列表 -->
            <el-row class="mod-list">
                <el-col :span="12" @dragover="list_dragover" @drop="list_drop">
                    <el-checkbox v-if="manager.selectionMode" v-model="(manager.selectionList as any)" :value="mod">
                        <template #default>
                            <!-- <v-chip size="small" v-for="item in mod.tags" label :key="item.name" :color="item.color">
                                {{ item.name }}</v-chip> -->
                            <ModTags :tags="mod.tags"></ModTags>
                            {{ mod.modName }}
                        </template>
                    </el-checkbox>
                    <template v-else>
                        <p v-if="!exit_name" @dblclick="exit_name = true" class="text-truncate" :title="mod.modName">
                            <v-icon class="list-sort" icon="mdi-dots-vertical" draggable="true"
                                @dragstart="dragstart($event, index)" @dragenter="dragenter($event, index, mod)"
                                @dragend="dragend" @dragover="dragover"></v-icon>
                            <!-- <v-chip size="small" v-for="item in mod.tags" label :key="item.name" :color="item.color">
                                {{ item.name }}</v-chip> -->
                            <ModTags :tags="mod.tags"></ModTags>
                            {{ mod.modName }}
                        </p>
                        <el-input v-else @blur="exit_name = false" @keydown.enter="exit_name = false"
                            v-model="mod.modName"></el-input>
                    </template>
                </el-col>
                <el-col :span="2" class="text-truncate" :title="mod.modVersion">{{ mod.modVersion }}</el-col>
                <el-col :span="4">
                    <el-select v-model="modType" :disabled="mod.isInstalled">
                        <el-option v-for="item in settings.settings.managerGame?.modType" :key="item.id"
                            :label="$t(item.name)" :value="item.id" />
                    </el-select>
                </el-col>
                <el-col :span="4" class="small-install">
                    <el-switch v-model="mod.isInstalled" size="small" :loading="loading" :disabled="manager.canChange"
                        :active-text="mod.isInstalled ? $t('Installed') : $t('Uninstalled')" />
                </el-col>
                <el-col :span="2" class="advanced">
                    <!-- <ContentAdvanced :mod="mod"></ContentAdvanced> -->
                    <ContentModMenu :mod="mod"></ContentModMenu>
                </el-col>
            </el-row>
        </el-col>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'ContentModList',
}
</script>
<style lang='less' scoped>
.wrap {
    .mod-list {
        display: flex;
        align-items: center;
        transition: all 0.3s;

        .list-sort {
            // 移动的手势
            cursor: move;

            &:hover {
                color: rgb(var(--v-theme-primary));
            }
        }

        &:hover {
            // 底部阴影
            box-shadow: 0 0 10px rgba(var(--v-theme-on-surface), 0.3);
        }

        .advanced {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .small-install {
        display: flex;
        justify-content: center;
    }

    .moveing {
        opacity: 0;
    }
}
</style>