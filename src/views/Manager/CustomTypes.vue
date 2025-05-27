<script lang='ts' setup>

const settings = useSettings()

const show = ref(false)

const formData = ref<IExpandsType>({
    name: '',
    installPath: '',
    install: {
        UseFunction: 'Unknown',
        folderName: '',
        isInstall: true,
        include: false,
        spare: false,
        keepPath: false,
        isExtname: false,
        inGameStorage: true,
    },
    uninstall: {
        UseFunction: 'Unknown',
        folderName: '',
        isInstall: false,
        include: false,
        spare: false,
        keepPath: false,
        isExtname: false,
        inGameStorage: true,
    },
    checkModType: {
        UseFunction: 'extname',
        Keyword: [],
    }
})

async function addType() {
    if (!formData.value.name || !formData.value.installPath) {
        ElMessage.error('请填写完整的类型信息')
        return
    }
    // 这里可以添加逻辑来处理添加类型的操作
    console.log('添加类型:', formData.value)

    await ExpandsType.saveExpandsType(formData.value)

    if (settings.settings.managerGame) {
        settings.settings.managerGame.modType = [
            ...settings.settings.managerGame.modType,
            ...ExpandsType.getExpandsTypeList(settings.settings.managerGame.gameName)
        ]
    }

    show.value = false
}

</script>
<template>
    <el-button link @click="show = true"><el-icon><el-icon-plus></el-icon-plus></el-icon></el-button>
    <Dialog v-model="show">
        <template #header>
            <h3>添加类型</h3>
        </template>
        <v-card color="#0000">
            <v-card-text>
                <el-form label-width="100">
                    <el-form-item label="类型名称">
                        <el-input v-model="formData.name" placeholder="请输入类型名称"></el-input>
                    </el-form-item>
                    <el-form-item label="安装路径">
                        <el-input v-model="formData.installPath" placeholder="请输入安装路径 (相对于主目录, 如: /mods)"></el-input>
                    </el-form-item>
                    <el-form-item label="安装">
                        <ExpandsAddTypesInstall v-model="formData.install"></ExpandsAddTypesInstall>
                    </el-form-item>
                    <el-form-item label="卸载">
                        <ExpandsAddTypesInstall v-model="formData.uninstall"></ExpandsAddTypesInstall>
                    </el-form-item>
                    <el-form-item label="检查方式">
                        <ExpandsAddCheckTypes v-model="formData.checkModType" isType></ExpandsAddCheckTypes>
                    </el-form-item>
                </el-form>
            </v-card-text>
        </v-card>
        <template #footer>
            <el-button @click="show = false">取消</el-button>
            <el-button type="primary" @click="addType">添加</el-button>
        </template>
    </Dialog>
</template>
<script lang='ts'>

export default {
    name: 'CustomTypes',
}
</script>
<style lang='less' scoped></style>
