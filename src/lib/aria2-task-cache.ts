import { join } from "@tauri-apps/api/path";
import type { IAria2RpcTask } from "@/lib/aria2-rpc";
import type { IGlossDownloadTaskMeta } from "@/lib/gloss-download";
import { PersistentStore } from "@/lib/persistent-store";

const ARIA2_TASK_SNAPSHOT_KEY = "aria2TaskSnapshotMap";
const RESTORED_TASK_ERROR_CODE = "GMM_RESTORED_TASK";
const RESTORED_TASK_ERROR_MESSAGE =
    "任务未从 aria2 会话恢复，可点击“重试”重新加入下载队列。";

function toNumber(value?: string | number) {
    const normalized = Number(value ?? 0);

    return Number.isFinite(normalized) ? normalized : 0;
}

function isFinishedByProgress(task: IAria2RpcTask) {
    const totalLength = toNumber(task.totalLength);
    const completedLength = toNumber(task.completedLength);

    return totalLength > 0 && completedLength >= totalLength;
}

function normalizeRestoredTask(task: IAria2RpcTask, liveGids: Set<string>) {
    if (liveGids.has(task.gid) || task.status === "removed") {
        return task;
    }

    if (isFinishedByProgress(task)) {
        return {
            ...task,
            status: "complete",
            downloadSpeed: "0",
            uploadSpeed: "0",
            connections: "0",
            errorCode: RESTORED_TASK_ERROR_CODE,
        };
    }

    if (["active", "waiting", "paused"].includes(task.status)) {
        return {
            ...task,
            status: "error",
            downloadSpeed: "0",
            uploadSpeed: "0",
            connections: "0",
            errorCode: RESTORED_TASK_ERROR_CODE,
            errorMessage: task.errorMessage || RESTORED_TASK_ERROR_MESSAGE,
        };
    }

    return {
        ...task,
        downloadSpeed: "0",
        uploadSpeed: "0",
        connections: "0",
        errorCode: RESTORED_TASK_ERROR_CODE,
    };
}

async function buildTaskFilePath(
    metadata: IGlossDownloadTaskMeta,
    fallbackDirectory?: string,
) {
    const fileName = metadata.fileName || metadata.resourceName || "";

    if (!fileName) {
        return "";
    }

    if (!fallbackDirectory) {
        return fileName;
    }

    return await join(fallbackDirectory, fileName);
}

async function createTaskFromMetadata(
    gid: string,
    metadata: IGlossDownloadTaskMeta,
    fallbackDirectory?: string,
) {
    const status = metadata.taskStatus === "complete" ? "complete" : "error";
    const filePath = await buildTaskFilePath(metadata, fallbackDirectory);
    const uri = metadata.downloadUrl?.trim();

    return {
        gid,
        status,
        totalLength: "0",
        completedLength: "0",
        uploadLength: "0",
        downloadSpeed: "0",
        uploadSpeed: "0",
        connections: "0",
        dir: fallbackDirectory,
        files: [
            {
                index: "1",
                path: filePath,
                length: "0",
                completedLength: "0",
                selected: "true",
                uris: uri ? [{ status: "used", uri }] : [],
            },
        ],
        errorCode: RESTORED_TASK_ERROR_CODE,
        errorMessage:
            metadata.taskStatus === "complete"
                ? undefined
                : RESTORED_TASK_ERROR_MESSAGE,
    } satisfies IAria2RpcTask;
}

export function isRestoredAria2Task(task?: IAria2RpcTask | null) {
    return task?.errorCode === RESTORED_TASK_ERROR_CODE;
}

export async function readAria2TaskSnapshots() {
    return (
        (await PersistentStore.get<Record<string, IAria2RpcTask>>(
            ARIA2_TASK_SNAPSHOT_KEY,
            {},
        )) ?? {}
    );
}

export async function mergeAria2TaskSnapshots(
    liveTasks: IAria2RpcTask[],
    taskMetaMap: Record<string, IGlossDownloadTaskMeta> = {},
    fallbackDirectory?: string,
) {
    const storedSnapshots = await readAria2TaskSnapshots();
    const liveGids = new Set(liveTasks.map((task) => task.gid));
    const nextSnapshots: Record<string, IAria2RpcTask> = {
        ...storedSnapshots,
    };

    for (const task of liveTasks) {
        if (task.status === "removed") {
            delete nextSnapshots[task.gid];
            continue;
        }

        nextSnapshots[task.gid] = task;
    }

    for (const [gid, metadata] of Object.entries(taskMetaMap)) {
        if (nextSnapshots[gid] || metadata.taskStatus === "removed") {
            continue;
        }

        nextSnapshots[gid] = await createTaskFromMetadata(
            gid,
            metadata,
            fallbackDirectory,
        );
    }

    const normalizedSnapshots: Record<string, IAria2RpcTask> = {};

    for (const [gid, task] of Object.entries(nextSnapshots)) {
        const normalizedTask = normalizeRestoredTask(task, liveGids);

        if (normalizedTask.status !== "removed") {
            normalizedSnapshots[gid] = normalizedTask;
        }
    }

    await PersistentStore.set(ARIA2_TASK_SNAPSHOT_KEY, normalizedSnapshots);

    return Object.values(normalizedSnapshots);
}

export async function removeAria2TaskSnapshot(gid: string) {
    const storedSnapshots = await readAria2TaskSnapshots();

    if (!storedSnapshots[gid]) {
        return;
    }

    const nextSnapshots = { ...storedSnapshots };
    delete nextSnapshots[gid];
    await PersistentStore.set(ARIA2_TASK_SNAPSHOT_KEY, nextSnapshots);
}

export async function removeAria2TaskSnapshots(gids: string[]) {
    if (gids.length === 0) {
        return;
    }

    const gidSet = new Set(gids);
    const storedSnapshots = await readAria2TaskSnapshots();
    const nextSnapshots = Object.fromEntries(
        Object.entries(storedSnapshots).filter(([gid]) => !gidSet.has(gid)),
    );

    await PersistentStore.set(ARIA2_TASK_SNAPSHOT_KEY, nextSnapshots);
}
