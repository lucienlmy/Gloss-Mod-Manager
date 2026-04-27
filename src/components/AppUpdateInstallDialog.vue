<script setup lang="ts">
import {
    cancelAppUpdateInstallDialog,
    confirmAppUpdateInstallDialog,
    syncAppUpdateInstallDialogOpen,
    useAppUpdateInstallDialogState,
} from "@/lib/app-update-install-dialog";

const dialogState = useAppUpdateInstallDialogState();
</script>

<template>
    <AlertDialog
        :open="dialogState.open"
        @update:open="syncAppUpdateInstallDialogOpen"
    >
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle
                    >新版本已下载完成，是否安装？</AlertDialogTitle
                >
                <AlertDialogDescription
                    class="flex flex-col gap-3 whitespace-pre-line text-left"
                >
                    <span>版本：v{{ dialogState.version }}</span>
                    <template v-if="dialogState.notes">
                        <span class="font-medium text-foreground"
                            >更新说明</span
                        >
                        <span>{{ dialogState.notes }}</span>
                    </template>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="cancelAppUpdateInstallDialog()">
                    否
                </AlertDialogCancel>
                <AlertDialogAction @click="confirmAppUpdateInstallDialog()">
                    是
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
