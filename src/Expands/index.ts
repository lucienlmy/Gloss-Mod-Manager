/**
 * 导出所有扩展
 */

import { ISupportedGames } from "@src/model/Interfaces"

// 批量导入当前目录中的所有组件
const modules = import.meta.glob('./*', { eager: true })

// function getAllExpands(): any {
//     // let message: any = {}
//     let message = getLangFiles(modules)
//     //   getLangFiles(viewModules,message)
//     return message
// }

function getLangFiles(mList: any) {
    let msg: ISupportedGames[] = []
    for (let path in mList) {
        if (mList[path].default) {
            let item = mList[path].default
            msg.push(item)
        }
    }
    return msg
}

export function getAllExpands(): any {
    let message = getLangFiles(modules)
    return message
}