/**
 * 导出所有扩展
 */

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

export function getAllExpands(): Promise<ISupportedGames>[] {
    const message = getLangFiles(modules);
    return message;
}
