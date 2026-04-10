<script setup lang="ts">
import { join } from "@tauri-apps/api/path";

const manager = useManager();

async function open(item: IModInfo) {
    const storagePath = await PersistentStore.get("storagePath", "");
    const path = await join(
        storagePath || "",
        "mods",
        manager.managerGame?.gameName || "",
        item.id.toString(),
    );
    FileHandler.openFolder(path);
}
</script>
<template>
    <Card>
        <CardContent class="max-h-[calc(100vh-430px)] overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>名称</TableHead>
                        <TableHead class="w-30">版本</TableHead>
                        <TableHead class="w-30">类型</TableHead>
                        <TableHead class="w-30">状态</TableHead>
                        <TableHead class="w-30">预览</TableHead>
                        <TableHead class="w-30">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow
                        v-for="item in manager.filteredMods"
                        :key="item.id">
                        <TableCell>
                            <div class="flex items-center gap-2">
                                <IconGripVertical class="w-4 h-4 cursor-move" />
                                <Badge
                                    variant="outline"
                                    v-for="tag in item.tags"
                                    :key="tag.name">
                                    <div
                                        class="h-2.5 w-2.5 rounded-full"
                                        :style="{
                                            backgroundColor: tag.color,
                                        }"></div>
                                    {{ tag.name }}
                                </Badge>
                                {{ item.modName }}
                            </div>
                        </TableCell>
                        <TableCell>{{ item.modVersion }}</TableCell>
                        <TableCell>
                            <Select v-model="item.modType">
                                <SelectTrigger>
                                    <SelectValue></SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        v-for="type in manager.managerGame
                                            ?.modType"
                                        :key="type.id"
                                        :value="type.id"
                                        >{{ type.name }}</SelectItem
                                    >
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <div class="flex items-center gap-2">
                                <Switch
                                    :id="`is-installed-${item.id}`"
                                    v-model="item.isInstalled" />
                                <Label :for="`is-installed-${item.id}`">
                                    {{ item.isInstalled ? "已安装" : "未安装" }}
                                </Label>
                            </div>
                        </TableCell>
                        <TableCell>
                            <HoverCard v-if="item.cover">
                                <HoverCardTrigger as-child>
                                    <Button variant="ghost" size="icon">
                                        <IconEye class="w-4 h-4" />
                                    </Button>
                                </HoverCardTrigger>
                                <HoverCardContent>
                                    <AsyncImage :src="item.cover" />
                                </HoverCardContent>
                            </HoverCard>
                            <IconEyeOff
                                v-else
                                class="w-4 h-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger as-child>
                                    <Button variant="ghost" size="icon">
                                        <IconMenu class="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        >编辑
                                        <DropdownMenuShortcut
                                            ><IconSquarePen />
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="open(item)">
                                        打开
                                        <DropdownMenuShortcut>
                                            <IconFolderOpen />
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        删除
                                        <DropdownMenuShortcut>
                                            <IconTrash
                                                class="text-destructive" />
                                        </DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </CardContent>
    </Card>
</template>
<style scoped></style>
