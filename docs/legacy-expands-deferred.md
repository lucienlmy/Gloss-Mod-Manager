# Legacy Expands 暂缓迁移清单

以下适配器仍需单独迁移或重写。本清单由 scripts/migrate-legacy-expands.ts 自动生成。

已自动迁移: 89 个
暂缓处理: 46 个

## AmericanTruckSimulator.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## ArmoredCore6.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## BaldursGate3.ts

- 依赖 LSX 配置读写与状态回写，需单独适配。
- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## BlackWukong.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## Cyberpunk2077.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## DeadOrAlive6.ts

- 旧实现已被整体注释，需先确认是否仍然维护。

## Divinityos2.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## DontStarve.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## DyingLight2.ts

- 依赖额外的 pak 顺序状态文件，安装流程需要单独验证。
- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## EldenRing.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## EuroTruckSimulator2.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## Fallout4.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## FS22.ts

- 旧实现已被整体注释，需先确认是否仍然维护。

## GranblueFantasyRelink.ts

- 旧实现已被整体注释，需先确认是否仍然维护。

## GrimDawn.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## GTA5.ts

- 依赖外部 GTA5Handler，当前仓库没有对应实现。

## GTA5Enhanced.ts

- 依赖外部 GTA5Handler，当前仓库没有对应实现。

## GuLong.ts

- 旧实现已被整体注释，需先确认是否仍然维护。

## Hades2.ts

- 安装或卸载后需要调用外部工具，需评估 Tauri 的启动与参数传递方案。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## Humankind.ts

- 旧实现已被整体注释，需先确认是否仍然维护。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## InZOI.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## KerbalSpaceProgram.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## L4D2.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## LegendOfHeros.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## LikeADragon8.ts

- 安装或卸载后需要调用外部工具，需评估 Tauri 的启动与参数传递方案。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## MiChangSheng.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## MonsterHunterRise.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## MonsterHunterWorld.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## MountBlade2.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## Nioh2.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## Nioh3.ts

- 安装或卸载后需要调用外部工具，需评估 Tauri 的启动与参数传递方案。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## NoMansSky.ts

- 依赖 mods.txt 状态维护，需补专用写回逻辑。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## OblivionRemastered.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## RedDead2.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## RimWorld.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## SkyrimSE.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## StardewValley.ts

- 安装或卸载后需要调用外部工具，需评估 Tauri 的启动与参数传递方案。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## Starfield.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## TaleofImmortal.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## TheScrollOfTaiwu.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## TheSims4.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## TheWitcher3.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。

## TotalWarTK.ts

- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## TWW3.ts

- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## WatchDogs2.ts

- 依赖额外的 pak 顺序状态文件，安装流程需要单独验证。
- 直接依赖 Node 同步文件系统 API，需改写为 Tauri 异步文件接口。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
- 直接依赖异步文件系统流程，需逐个确认 Promise 语义。

## Xcom2.ts

- 旧实现已被整体注释，需先确认是否仍然维护。
- 直接依赖旧 manager store 结构，需要单独兼容或重写。
