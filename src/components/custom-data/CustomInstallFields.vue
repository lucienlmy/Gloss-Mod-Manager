<script setup lang="ts">
const model = defineModel<ITypeInstall>({ required: true });
</script>

<template>
    <div class="grid gap-3">
        <div class="grid gap-2">
            <Label>方法</Label>
            <Select v-model="model.UseFunction">
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="generalInstall">基础安装</SelectItem>
                    <SelectItem value="generalUninstall">基础卸载</SelectItem>
                    <SelectItem value="installByFolder">
                        以文件夹为分割安装/卸载
                    </SelectItem>
                    <SelectItem value="installByFile">
                        以文件为基准安装/卸载
                    </SelectItem>
                    <SelectItem value="installByFileSibling">
                        以文件同级内容安装/卸载
                    </SelectItem>
                    <SelectItem value="installByFolderParent">
                        以父目录软链安装/卸载
                    </SelectItem>
                    <SelectItem value="Unknown">未知</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div
            v-if="
                ['installByFolder', 'installByFolderParent'].includes(
                    model.UseFunction,
                )
            "
            class="grid gap-2"
        >
            <Label>文件夹名称</Label>
            <Input
                v-model="model.folderName"
                placeholder="例如：plugins、mods"
            />
        </div>

        <div
            v-if="
                ['installByFile', 'installByFileSibling'].includes(
                    model.UseFunction,
                )
            "
            class="grid gap-2"
        >
            <Label>文件名称</Label>
            <Input
                v-model="model.fileName"
                placeholder="例如：winhttp.dll"
            />
        </div>

        <div
            v-if="
                [
                    'installByFolder',
                    'installByFile',
                    'installByFileSibling',
                    'installByFolderParent',
                ].includes(model.UseFunction)
            "
            class="flex items-center justify-between rounded-lg border px-3 py-2"
        >
            <div class="space-y-1">
                <div class="text-sm font-medium">执行方向</div>
                <p class="text-xs text-muted-foreground">
                    用于兼容旧版配置中的安装/卸载方向定义。
                </p>
            </div>
            <Switch v-model="model.isInstall" />
        </div>

        <div
            v-if="model.UseFunction === 'installByFolder'"
            class="flex items-center justify-between rounded-lg border px-3 py-2"
        >
            <div class="space-y-1">
                <div class="text-sm font-medium">包含文件夹本身</div>
                <p class="text-xs text-muted-foreground">
                    开启后会把目标文件夹一并作为安装根。
                </p>
            </div>
            <Switch v-model="model.include" />
        </div>

        <div
            v-if="model.UseFunction === 'installByFolder'"
            class="flex items-center justify-between rounded-lg border px-3 py-2"
        >
            <div class="space-y-1">
                <div class="text-sm font-medium">保留其他文件</div>
                <p class="text-xs text-muted-foreground">
                    用于旧版 `spare` 配置。
                </p>
            </div>
            <Switch v-model="model.spare" />
        </div>

        <div
            v-if="
                ['generalInstall', 'generalUninstall'].includes(model.UseFunction)
            "
            class="flex items-center justify-between rounded-lg border px-3 py-2"
        >
            <div class="space-y-1">
                <div class="text-sm font-medium">保留原路径</div>
                <p class="text-xs text-muted-foreground">
                    直接按缓存中的相对目录结构安装。
                </p>
            </div>
            <Switch v-model="model.keepPath" />
        </div>

        <div
            v-if="
                ['installByFile', 'installByFileSibling'].includes(
                    model.UseFunction,
                )
            "
            class="flex items-center justify-between rounded-lg border px-3 py-2"
        >
            <div class="space-y-1">
                <div class="text-sm font-medium">按扩展名匹配</div>
                <p class="text-xs text-muted-foreground">
                    旧版 `isExtname` 选项。
                </p>
            </div>
            <Switch v-model="model.isExtname" />
        </div>

        <div
            v-if="
                [
                    'generalInstall',
                    'generalUninstall',
                    'installByFile',
                    'installByFileSibling',
                    'installByFolderParent',
                ].includes(model.UseFunction)
            "
            class="flex items-center justify-between rounded-lg border px-3 py-2"
        >
            <div class="space-y-1">
                <div class="text-sm font-medium">安装到游戏目录</div>
                <p class="text-xs text-muted-foreground">
                    关闭后会直接使用填写的安装路径。
                </p>
            </div>
            <Switch v-model="model.inGameStorage" />
        </div>
    </div>
</template>

<style scoped></style>
