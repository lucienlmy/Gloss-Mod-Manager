import { ElMessage } from "element-plus-message";
import { Aria2Rpc, type IAria2RpcTask } from "@/lib/aria2-rpc";
import { FileHandler } from "@/lib/FileHandler";
import {
    findGlossDuplicateLocalMods,
    type IGlossDownloadTaskMeta,
} from "@/lib/gloss-download";
import { resolveGlossDownloadImportSourceType } from "@/lib/gloss-download-queue";
import {
    importLocalModSources,
    type ILocalModImportSource,
} from "@/lib/local-mod-import";
import { syncManagerRuntimeContext } from "@/lib/manager-context";
import { hydrateManagerRuntimeData } from "@/lib/manager-runtime-data";
import { PersistentStore } from "@/lib/persistent-store";

interface IGlossDownloadMonitorManager {
    managerGame: ISupportedGames | null;
    managerRoot: string;
    managerModList: IModInfo[];
    availableTypes: IType[];
    textCollator: Intl.Collator;
    tags: ITag[];
    selectedType: number | string | 0;
    selectedTag: string;
    saveManagerData: () => Promise<void>;
}

interface IGlossDownloadMonitorSettings {
    autoAddAfterDownload: boolean;
    storagePath: string;
    closeSoftLinks: boolean;
}

interface ITaskMetaSyncResult {
    changed: boolean;
    nextTaskMetaMap: Record<string, IGlossDownloadTaskMeta>;
    newlyCompletedTaskGids: string[];
}

const ARIA2_TASK_META_KEY = "aria2TaskMetaMap";
const POLL_INTERVAL_MS = 2000;
const importingTaskGids = new Set<string>();

function getTaskPrimaryFile(task: IAria2RpcTask) {
    return task.files.find((item) => item.path) ?? task.files[0] ?? null;
}

function getBaseName(filePath?: string) {
    if (!filePath) {
        return "";
    }

    return filePath.split(/[\\/]+/u).pop() ?? filePath;
}

async function readTaskMetaMap() {
    return (
        (await PersistentStore.get<Record<string, IGlossDownloadTaskMeta>>(
            ARIA2_TASK_META_KEY,
            {},
        )) ?? {}
    );
}

async function updateTaskMeta(
    gid: string,
    metadata: Partial<IGlossDownloadTaskMeta>,
) {
    const taskMetaMap = await readTaskMetaMap();
    const currentMeta = taskMetaMap[gid];

    if (!currentMeta) {
        return;
    }

    await PersistentStore.set(ARIA2_TASK_META_KEY, {
        ...taskMetaMap,
        [gid]: {
            ...currentMeta,
            ...metadata,
        },
    });
}

function syncTaskMetaStatuses(
    taskMetaMap: Record<string, IGlossDownloadTaskMeta>,
    tasks: IAria2RpcTask[],
): ITaskMetaSyncResult {
    const nextTaskMetaMap = { ...taskMetaMap };
    const newlyCompletedTaskGids: string[] = [];
    let changed = false;

    for (const task of tasks) {
        const currentMeta = nextTaskMetaMap[task.gid];

        if (!currentMeta) {
            continue;
        }

        const nextMeta: IGlossDownloadTaskMeta = {
            ...currentMeta,
            taskStatus: task.status as TaskStatus,
            updatedAt: new Date().toISOString(),
        };

        if (
            task.status === "complete" &&
            currentMeta.taskStatus !== "complete"
        ) {
            newlyCompletedTaskGids.push(task.gid);
        }

        if (task.status === "complete" && !currentMeta.downloadedAt) {
            nextMeta.downloadedAt = new Date().toISOString();
        }

        if (
            nextMeta.taskStatus !== currentMeta.taskStatus ||
            nextMeta.downloadedAt !== currentMeta.downloadedAt
        ) {
            nextTaskMetaMap[task.gid] = nextMeta;
            changed = true;
        }
    }

    return {
        changed,
        nextTaskMetaMap,
        newlyCompletedTaskGids,
    };
}

export async function autoImportCompletedGlossTasks(
    manager: IGlossDownloadMonitorManager,
    settings: IGlossDownloadMonitorSettings,
    completedTaskGids: string[],
    tasks: IAria2RpcTask[],
) {
    if (!settings.autoAddAfterDownload || completedTaskGids.length === 0) {
        return;
    }

    if (!settings.storagePath || !manager.managerGame) {
        return;
    }

    for (const gid of completedTaskGids) {
        if (importingTaskGids.has(gid)) {
            continue;
        }

        const task = tasks.find((item) => item.gid === gid);
        const taskMetaMap = await readTaskMetaMap();
        const metadata = taskMetaMap[gid];

        if (
            !task ||
            !metadata ||
            metadata.localModId ||
            task.status !== "complete"
        ) {
            continue;
        }

        importingTaskGids.add(gid);

        try {
            await syncManagerRuntimeContext(manager, {
                storagePath: settings.storagePath,
                closeSoftLinks: settings.closeSoftLinks,
            });
            await hydrateManagerRuntimeData(manager);

            if (!manager.managerGame || !manager.managerRoot) {
                continue;
            }

            const primaryFile = getTaskPrimaryFile(task);

            if (!primaryFile?.path) {
                continue;
            }

            if (!(await FileHandler.fileExists(primaryFile.path))) {
                continue;
            }

            const importMetadata = {
                modName:
                    metadata.modTitle ||
                    metadata.resourceName ||
                    getBaseName(primaryFile.path),
                fileName: metadata.fileName || getBaseName(primaryFile.path),
                modVersion: metadata.version || "1.0.0",
                modAuthor: metadata.author || "",
                modWebsite: metadata.sourceUrl || "",
                modDesc: metadata.content || "",
                cover: metadata.cover,
                from: (metadata.modId ? "GlossMod" : "Customize") as sourceType,
                webId: metadata.modId,
                gameID: manager.managerGame.GlossGameId,
                other: {
                    downloadTaskGid: task.gid,
                    sourceUrl: metadata.sourceUrl || "",
                },
            };
            const duplicateLocalMods = findGlossDuplicateLocalMods(
                manager.managerModList,
                {
                    modId: metadata.modId,
                    fileName: importMetadata.fileName,
                    modTitle: importMetadata.modName,
                },
            );
            const overwriteTargetMod =
                metadata.replaceLocalModId !== undefined
                    ? (duplicateLocalMods.find((item) => {
                          return (
                              Number(item.mod.id) ===
                              Number(metadata.replaceLocalModId)
                          );
                      })?.mod ?? null)
                    : null;

            const importSource: ILocalModImportSource = {
                path: primaryFile.path,
                sourceType: await resolveGlossDownloadImportSourceType(
                    primaryFile.path,
                    metadata,
                ),
                metadata: importMetadata,
            };

            if (duplicateLocalMods.length > 0) {
                if (overwriteTargetMod) {
                    importSource.duplicateStrategy = "overwrite";
                    importSource.targetMod = overwriteTargetMod;
                } else {
                    const targetLocalMod = duplicateLocalMods[0].mod;

                    await updateTaskMeta(gid, {
                        localModId: targetLocalMod.id,
                        importedAt: new Date().toISOString(),
                    });
                    continue;
                }
            }

            const result = await importLocalModSources(manager, [importSource]);
            const importedMod = result.importedMods[0];

            if (!importedMod) {
                continue;
            }

            await updateTaskMeta(gid, {
                localModId: importedMod.id,
                importedAt: new Date().toISOString(),
            });

            if (overwriteTargetMod) {
                ElMessage.success(`已自动更新本地 Mod：${importedMod.modName}`);
                continue;
            }

            ElMessage.success(`已自动导入到管理器：${importedMod.modName}`);
        } catch (error: unknown) {
            console.error("自动导入下载任务失败");
            console.error(error);
        } finally {
            importingTaskGids.delete(gid);
        }
    }
}

export class GlossDownloadMonitor {
    private static initialized = false;
    private static intervalId: ReturnType<
        typeof globalThis.setInterval
    > | null = null;
    private static refreshing = false;
    private static manager: IGlossDownloadMonitorManager | null = null;
    private static settings: IGlossDownloadMonitorSettings | null = null;

    public static start(
        manager: IGlossDownloadMonitorManager,
        settings: IGlossDownloadMonitorSettings,
    ) {
        GlossDownloadMonitor.manager = manager;
        GlossDownloadMonitor.settings = settings;

        if (GlossDownloadMonitor.intervalId !== null) {
            return;
        }

        void GlossDownloadMonitor.refresh();
        GlossDownloadMonitor.intervalId = globalThis.setInterval(() => {
            void GlossDownloadMonitor.refresh();
        }, POLL_INTERVAL_MS);
    }

    private static async refresh() {
        if (
            GlossDownloadMonitor.refreshing ||
            !GlossDownloadMonitor.manager ||
            !GlossDownloadMonitor.settings
        ) {
            return;
        }

        GlossDownloadMonitor.refreshing = true;

        try {
            const taskMetaMap = await readTaskMetaMap();

            if (Object.keys(taskMetaMap).length === 0) {
                GlossDownloadMonitor.initialized = true;
                return;
            }

            const [activeTasks, waitingTasks, stoppedTasks] = await Promise.all(
                [
                    Aria2Rpc.tellActive(),
                    Aria2Rpc.tellWaiting(0, 100),
                    Aria2Rpc.tellStopped(0, 100),
                ],
            );
            const allTasks = [...activeTasks, ...waitingTasks, ...stoppedTasks];
            const syncResult = syncTaskMetaStatuses(taskMetaMap, allTasks);

            if (syncResult.changed) {
                await PersistentStore.set(
                    ARIA2_TASK_META_KEY,
                    syncResult.nextTaskMetaMap,
                );
            }

            if (!GlossDownloadMonitor.initialized) {
                GlossDownloadMonitor.initialized = true;
            }

            await autoImportCompletedGlossTasks(
                GlossDownloadMonitor.manager,
                GlossDownloadMonitor.settings,
                syncResult.newlyCompletedTaskGids,
                allTasks,
            );
        } catch (error: unknown) {
            console.error("后台下载监控刷新失败");
            console.error(error);
        } finally {
            GlossDownloadMonitor.refreshing = false;
        }
    }
}

export function initializeGlossDownloadMonitor(
    manager: IGlossDownloadMonitorManager,
    settings: IGlossDownloadMonitorSettings,
) {
    GlossDownloadMonitor.start(manager, settings);
}
