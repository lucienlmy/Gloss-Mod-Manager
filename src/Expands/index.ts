/**
 * 导出所有扩展
 */

import {
    loadLegacyCustomGames,
    mergeLegacyCustomTypesIntoGame,
} from "@/lib/legacy-custom-data";

// 批量导入当前目录中的所有组件
const modules = import.meta.glob("./*.ts", { eager: true });
function getLangFiles(mList: any) {
    let msg: Promise<ISupportedGames>[] = [];
    for (let path in mList) {
        // console.log(mList[path]);
        if (mList[path].supportedGames) {
            let item = mList[path].supportedGames();
            msg.push(item);
        }
    }
    return msg;
}

function dedupeSupportedGames(list: ISupportedGames[]) {
    const gameMap = new Map<string, ISupportedGames>();

    for (const item of list) {
        gameMap.set(item.gameName.trim().toLowerCase(), item);
    }

    return [...gameMap.values()];
}

export async function getAllExpands(): Promise<ISupportedGames[]> {
    const internalGames = await Promise.all(getLangFiles(modules));
    const mergedInternalGames = await Promise.all(
        internalGames.map((item) => mergeLegacyCustomTypesIntoGame(item)),
    );
    const legacyCustomGames = await loadLegacyCustomGames();

    return dedupeSupportedGames([...legacyCustomGames, ...mergedInternalGames]);
}
