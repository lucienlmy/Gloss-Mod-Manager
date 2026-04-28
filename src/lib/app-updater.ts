import { isTauri } from "@tauri-apps/api/core";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { ElMessage } from "element-plus-message";
import { Log } from "@/lib/log";

const AUTO_UPDATE_CHECK_DELAY = 1500;
const UPDATE_REQUEST_TIMEOUT = 30000;
type AppUpdateInstallTrigger = "close-window" | "quit-app";

let initializationStarted = false;
let runningCheckTask: Promise<void> | null = null;
let preparedUpdate: Update | null = null;
let shouldInstallPreparedUpdateOnQuit = false;
let isInstallingPreparedUpdate = false;

function shouldSkipUpdater() {
    return !isTauri() || import.meta.env.DEV;
}

async function replacePreparedUpdate(nextUpdate: Update) {
    if (preparedUpdate && preparedUpdate !== nextUpdate) {
        try {
            await preparedUpdate.close();
        } catch {
            // 旧更新资源关闭失败不会影响新更新的后续安装。
        }
    }

    preparedUpdate = nextUpdate;
    shouldInstallPreparedUpdateOnQuit = false;
}

function restorePreparedUpdate(update: Update, installOnQuit: boolean) {
    preparedUpdate = update;
    shouldInstallPreparedUpdateOnQuit = installOnQuit;
}

function buildInstallLog(trigger: AppUpdateInstallTrigger, version: string) {
    switch (trigger) {
        case "close-window":
            return `用户关闭主窗口，开始静默安装已下载更新 v${version}。`;
        case "quit-app":
            return `用户退出应用，开始静默安装已下载更新 v${version}。`;
    }

    return `开始静默安装已下载更新 v${version}。`;
}

export function hasPendingAppUpdateInstall() {
    return (
        preparedUpdate !== null &&
        shouldInstallPreparedUpdateOnQuit &&
        !isInstallingPreparedUpdate
    );
}

export async function installPendingAppUpdate(
    trigger: AppUpdateInstallTrigger,
    notifyFailure = true,
) {
    if (!preparedUpdate || isInstallingPreparedUpdate) {
        return false;
    }

    const update = preparedUpdate;
    const installOnQuit = shouldInstallPreparedUpdateOnQuit;

    preparedUpdate = null;
    shouldInstallPreparedUpdateOnQuit = false;
    isInstallingPreparedUpdate = true;

    try {
        await Log.info(buildInstallLog(trigger, update.version));
        await update.install();

        return true;
    } catch (error: unknown) {
        console.error("更新安装失败");
        console.error(error);
        await Log.error("更新安装失败。", error);
        restorePreparedUpdate(update, installOnQuit);

        if (notifyFailure) {
            ElMessage.error("启动更新安装失败，请稍后重试。");
        }

        return false;
    } finally {
        if (preparedUpdate !== update) {
            try {
                await update.close();
            } catch {
                // 安装后资源关闭失败不影响更新结果。
            }
        }

        isInstallingPreparedUpdate = false;
    }
}

export async function checkForAppUpdates() {
    if (shouldSkipUpdater()) {
        return;
    }

    if (preparedUpdate || isInstallingPreparedUpdate) {
        return;
    }

    if (runningCheckTask) {
        return runningCheckTask;
    }

    runningCheckTask = (async () => {
        let update: Update | null = null;
        let updateLifecycleTransferred = false;

        try {
            update = await check({
                timeout: UPDATE_REQUEST_TIMEOUT,
            });

            if (!update) {
                return;
            }

            await Log.info(
                `发现应用更新：${update.currentVersion} -> ${update.version}`,
            );
            await update.download(undefined, {
                timeout: UPDATE_REQUEST_TIMEOUT,
            });

            // 下载完成后保留 Update 资源，关闭或退出应用时交给 Tauri 静默安装。
            await replacePreparedUpdate(update);
            updateLifecycleTransferred = true;
            shouldInstallPreparedUpdateOnQuit = true;
            await Log.info(
                `应用更新 v${update.version} 已下载完成，将在关闭主窗口或退出应用时自动静默安装。`,
            );
            ElMessage.success(
                `新版本 ${update.version} 已就绪，将在关闭后自动安装`,
            );
        } catch (error: unknown) {
            console.error("自动更新检查失败");
            console.error(error);
            await Log.error("自动更新检查失败。", error);
        } finally {
            if (!updateLifecycleTransferred) {
                try {
                    await update?.close();
                } catch {
                    // 关闭资源失败不会影响后续更新检查。
                }
            }

            runningCheckTask = null;
        }
    })();

    return runningCheckTask;
}

export function initializeAppUpdater() {
    if (initializationStarted || shouldSkipUpdater()) {
        return;
    }

    initializationStarted = true;

    window.setTimeout(() => {
        void checkForAppUpdates();
    }, AUTO_UPDATE_CHECK_DELAY);
}
