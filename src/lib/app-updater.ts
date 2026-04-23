import { isTauri } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { check } from "@tauri-apps/plugin-updater";
import { ElMessage } from "element-plus-message";
import { Log } from "@/lib/log";

const AUTO_UPDATE_CHECK_DELAY = 1500;
const UPDATE_REQUEST_TIMEOUT = 30000;

let initializationStarted = false;
let runningCheckTask: Promise<void> | null = null;

function shouldSkipUpdater() {
    return !isTauri() || import.meta.env.DEV;
}

function buildInstallPrompt(version: string, notes?: string) {
    const normalizedNotes = notes?.trim();

    if (!normalizedNotes) {
        return `新版本 v${version} 已下载完成，是否立即安装？`;
    }

    return `新版本 v${version} 已下载完成。\n\n更新说明：\n${normalizedNotes}\n\n是否立即安装？`;
}

export async function checkForAppUpdates() {
    if (shouldSkipUpdater()) {
        return;
    }

    if (runningCheckTask) {
        return runningCheckTask;
    }

    runningCheckTask = (async () => {
        let update: Awaited<ReturnType<typeof check>> = null;

        try {
            update = await check({
                timeout: UPDATE_REQUEST_TIMEOUT,
            });

            if (!update) {
                await Log.info("自动更新检查完成，当前已是最新版本。");
                return;
            }

            await Log.info(
                `发现应用更新：${update.currentVersion} -> ${update.version}`,
            );
            ElMessage.info(`发现新版本 v${update.version}，正在后台下载。`);

            await update.download(undefined, {
                timeout: UPDATE_REQUEST_TIMEOUT,
            });

            ElMessage.success(`新版本 v${update.version} 已下载完成。`);

            const confirmed = window.confirm(
                buildInstallPrompt(update.version, update.body),
            );

            if (!confirmed) {
                await Log.info(`用户暂缓安装已下载的更新 v${update.version}。`);
                ElMessage.info("更新已下载，可稍后重新启动应用完成安装。");
                return;
            }

            await Log.info(`开始安装更新 v${update.version}。`);
            await update.install();

            if ((await platform()) !== "windows") {
                ElMessage.success("更新已安装，请重启应用以完成更新。");
            }
        } catch (error: unknown) {
            console.error("自动更新检查失败");
            console.error(error);
            await Log.error("自动更新检查失败。", error);
        } finally {
            try {
                await update?.close();
            } catch {
                // 关闭资源失败不会影响后续更新检查。
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
