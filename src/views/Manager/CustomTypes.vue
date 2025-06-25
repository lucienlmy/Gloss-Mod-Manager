<script lang='ts' setup>

const settings = useSettings()

const manager = useManager()

async function addType() {
    if (!manager.custonTypes.formData.name || !manager.custonTypes.formData.installPath) {
        ElMessage.error('请填写完整的类型信息')
        return
    }
    // 这里可以添加逻辑来处理添加类型的操作
    console.log('添加类型:', manager.custonTypes.formData)

    await ExpandsType.saveExpandsType(manager.custonTypes.formData)

    if (settings.settings.managerGame) {
        settings.settings.managerGame.modType = [
            ...settings.settings.managerGame.modType.filter(item => !item.local),
            ...ExpandsType.getExpandsTypeList(settings.settings.managerGame.gameName)
        ]
    }

    clearForm()
    manager.custonTypes.showEdit = false
}

function clearForm() {
    manager.custonTypes.formData = {
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
        local: true,
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
    }
}

</script>
<template>
    <el-button link
        @click="manager.custonTypes.showEdit = true"><el-icon><el-icon-plus></el-icon-plus></el-icon></el-button>
    <Dialog v-model="manager.custonTypes.showEdit">
        <template #header>
            <h3>添加类型</h3>
        </template>
        <v-card color="#0000">
            <v-card-text>
                <el-form label-width="100">
                    <el-form-item label="类型名称">
                        <el-input v-model="manager.custonTypes.formData.name" placeholder="请输入类型名称"></el-input>
                    </el-form-item>
                    <el-form-item label="安装路径">
                        <el-input v-model="manager.custonTypes.formData.installPath"
                            placeholder="请输入安装路径 (相对于主目录, 如: /mods)"></el-input>
                    </el-form-item>
                    <el-form-item label="安装">
                        <ExpandsAddTypesInstall v-model="manager.custonTypes.formData.install"></ExpandsAddTypesInstall>
                    </el-form-item>
                    <el-form-item label="卸载">
                        <ExpandsAddTypesInstall v-model="manager.custonTypes.formData.uninstall">
                        </ExpandsAddTypesInstall>
                    </el-form-item>
                    <el-form-item label="检查方式">
                        <ExpandsAddCheckTypes v-model="manager.custonTypes.formData.checkModType" isType>
                        </ExpandsAddCheckTypes>
                    </el-form-item>
                </el-form>
            </v-card-text>
        </v-card>
        <template #footer>
            <el-button @click="manager.custonTypes.showEdit = false">取消</el-button>
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
