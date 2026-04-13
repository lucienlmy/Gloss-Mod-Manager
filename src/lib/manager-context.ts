import { join } from "@tauri-apps/api/path";
import { Manager } from "@/lib/Manager";

interface IManagerRuntimeStore {
    managerGame: ISupportedGames | null;
    managerRoot: string;
}

interface ISyncManagerRuntimeContextOptions {
    storagePath: string;
    closeSoftLinks: boolean;
}

/**
 * 在非管理页中也同步本地管理器上下文，避免下载页导入时拿不到 modStorage。
 */
export async function syncManagerRuntimeContext(
    manager: IManagerRuntimeStore,
    options: ISyncManagerRuntimeContextOptions,
) {
    if (!manager.managerGame || !options.storagePath) {
        manager.managerRoot = "";
        Manager.configureContext({
            modStorage: "",
            gameStorage: manager.managerGame?.gamePath ?? "",
            closeSoftLinks: options.closeSoftLinks,
        });

        return "";
    }

    manager.managerRoot = await join(
        options.storagePath,
        "mods",
        manager.managerGame.gameName ?? "",
    );
    Manager.configureContext({
        modStorage: manager.managerRoot,
        gameStorage: manager.managerGame?.gamePath ?? "",
        closeSoftLinks: options.closeSoftLinks,
    });

    return manager.managerRoot;
}